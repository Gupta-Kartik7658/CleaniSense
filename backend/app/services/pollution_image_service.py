from __future__ import annotations

import argparse
import json
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Dict, Mapping, Optional, Union

import cv2
import numpy as np
from skimage.feature import graycomatrix, graycoprops, local_binary_pattern


ImageInput = Union[str, Path, bytes, np.ndarray]


@dataclass
class DetectorResult:
    name: str
    score: float
    coverage_ratio: float
    detected: bool
    features: Dict[str, float] = field(default_factory=dict)
    mask: Optional[np.ndarray] = None

    def to_dict(self, include_mask: bool = False) -> Dict[str, Any]:
        payload: Dict[str, Any] = {
            "name": self.name,
            "score": round(float(self.score), 4),
            "coverage_ratio": round(float(self.coverage_ratio), 4),
            "detected": bool(self.detected),
            "features": {key: round(float(value), 4) for key, value in self.features.items()},
        }
        if include_mask and self.mask is not None:
            payload["mask"] = self.mask.copy()
        return payload


@dataclass
class PollutionAnalysisResult:
    pollution_detected: bool
    dominant_type: str
    severity_score: float
    severity_label: str
    ai_confidence_score: float
    detectors: Dict[str, DetectorResult]
    color_features: Dict[str, float]
    texture_features: Dict[str, float]
    metadata: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self, include_masks: bool = False) -> Dict[str, Any]:
        return {
            "pollution_detected": self.pollution_detected,
            "dominant_type": self.dominant_type,
            "severity_score": round(float(self.severity_score), 2),
            "severity_label": self.severity_label,
            "ai_confidence_score": round(float(self.ai_confidence_score), 2),
            "color_features": {
                key: round(float(value), 4) for key, value in self.color_features.items()
            },
            "texture_features": {
                key: round(float(value), 4) for key, value in self.texture_features.items()
            },
            "detectors": {
                name: detector.to_dict(include_mask=include_masks)
                for name, detector in self.detectors.items()
            },
            "metadata": self.metadata,
        }


class PollutionImageService:
    """
    Classical computer-vision baseline for pollution analysis.

    This service intentionally avoids ML/LLM inference and relies on:
    - color-space heuristics
    - texture descriptors
    - morphological filtering
    - simple region analysis
    """

    MAX_DIMENSION = 1024

    def analyze(
        self,
        image_input: ImageInput,
        category_name: Optional[str] = None,
    ) -> PollutionAnalysisResult:
        views = self._prepare_image_views(image_input)
        color_features = self.extract_color_features(views)
        texture_features = self.extract_texture_features(views["gray"])

        smoke = self.detect_smoke(views)
        dust_haze = self.detect_dust_haze(views)
        garbage = self.segment_garbage(views)
        water_contamination = self.detect_water_contamination(views)
        wastewater = self.detect_wastewater_sewerage(views)

        detectors = {
            smoke.name: smoke,
            dust_haze.name: dust_haze,
            garbage.name: garbage,
            water_contamination.name: water_contamination,
            wastewater.name: wastewater,
        }

        dominant_type = self._select_dominant_type(detectors, category_name)
        severity_score = self.compute_image_severity(detectors, color_features, texture_features)
        severity_label = self._severity_label(severity_score)
        ai_confidence_score = self._ai_confidence_proxy(detectors, dominant_type, category_name)
        positive_detectors = sum(1 for detector in detectors.values() if detector.detected)
        pollution_detected = positive_detectors > 0 and (
            severity_score >= 30.0 or detectors[dominant_type].score >= 0.35
        )

        return PollutionAnalysisResult(
            pollution_detected=pollution_detected,
            dominant_type=dominant_type if pollution_detected else "low_signal",
            severity_score=severity_score,
            severity_label=severity_label,
            ai_confidence_score=ai_confidence_score,
            detectors=detectors,
            color_features=color_features,
            texture_features=texture_features,
            metadata={
                "image_shape": tuple(int(value) for value in views["bgr"].shape),
                "supported_pollution_types": [
                    "smoke",
                    "dust_haze",
                    "garbage_accumulation",
                    "water_contamination",
                    "wastewater_sewerage",
                ],
                "category_hint": category_name,
                "note": (
                    "Classical CV runs first. The AI confidence score is a local "
                    "verification proxy used for the SRS hybrid-confidence slot "
                    "when an external Gemini Vision call is unavailable."
                ),
            },
        )

    def detect_pollution(
        self,
        image_input: ImageInput,
        category_name: Optional[str] = None,
    ) -> Dict[str, Any]:
        return self.analyze(image_input, category_name=category_name).to_dict()

    def extract_color_features(
        self,
        image_input: Union[ImageInput, Mapping[str, np.ndarray]],
    ) -> Dict[str, float]:
        views = (
            image_input
            if isinstance(image_input, Mapping)
            else self._prepare_image_views(image_input)
        )
        hsv = views["hsv"]
        bgr = views["bgr"]

        hue = hsv[:, :, 0]
        sat = hsv[:, :, 1]
        val = hsv[:, :, 2]
        blue, green, red = cv2.split(bgr)

        neutral_mask = (
            (np.abs(red.astype(np.int16) - green.astype(np.int16)) <= 28)
            & (np.abs(red.astype(np.int16) - blue.astype(np.int16)) <= 32)
            & (np.abs(green.astype(np.int16) - blue.astype(np.int16)) <= 32)
        )
        brown_mask = (
            (hue >= 8)
            & (hue <= 30)
            & (sat >= 45)
            & (val >= 35)
            & (val <= 220)
        )
        warm_mask = ((hue <= 25) | (hue >= 170)) & (sat >= 90) & (val >= 120)

        return {
            "mean_hue": float(np.mean(hue) / 179.0),
            "mean_saturation": float(np.mean(sat) / 255.0),
            "mean_value": float(np.mean(val) / 255.0),
            "neutral_ratio": float(np.mean(neutral_mask)),
            "brown_ratio": float(np.mean(brown_mask)),
            "warm_ratio": float(np.mean(warm_mask)),
            "channel_std": float(np.std(bgr.astype(np.float32)) / 128.0),
        }

    def extract_texture_features(self, gray_image: np.ndarray) -> Dict[str, float]:
        quantized = np.clip(gray_image // 8, 0, 31).astype(np.uint8)
        glcm = graycomatrix(
            quantized,
            distances=[1, 2],
            angles=[0.0, np.pi / 4.0, np.pi / 2.0, 3.0 * np.pi / 4.0],
            levels=32,
            symmetric=True,
            normed=True,
        )
        lbp = local_binary_pattern(gray_image, P=8, R=1, method="uniform")
        lbp_hist, _ = np.histogram(
            lbp.ravel(),
            bins=np.arange(0, 11),
            range=(0, 10),
            density=True,
        )
        lbp_hist = lbp_hist[lbp_hist > 0]
        lbp_entropy = float(-np.sum(lbp_hist * np.log2(lbp_hist)))

        contrast = float(np.mean(graycoprops(glcm, "contrast")))
        homogeneity = float(np.mean(graycoprops(glcm, "homogeneity")))
        energy = float(np.mean(graycoprops(glcm, "energy")))
        correlation = float(np.mean(graycoprops(glcm, "correlation")))

        return {
            "glcm_contrast": contrast,
            "glcm_homogeneity": homogeneity,
            "glcm_energy": energy,
            "glcm_correlation": correlation,
            "lbp_entropy": lbp_entropy,
        }

    def detect_smoke(
        self,
        image_input: Union[ImageInput, Mapping[str, np.ndarray]],
    ) -> DetectorResult:
        views = (
            image_input
            if isinstance(image_input, Mapping)
            else self._prepare_image_views(image_input)
        )
        bgr = views["bgr"]
        hsv = views["hsv"]
        gray = views["gray"]
        lab = views["lab"]

        sat = hsv[:, :, 1]
        val = hsv[:, :, 2]
        a_channel = lab[:, :, 1].astype(np.float32)
        b_channel = lab[:, :, 2].astype(np.float32)

        chroma_distance = np.sqrt((a_channel - 128.0) ** 2 + (b_channel - 128.0) ** 2)
        neutral_mask = chroma_distance <= 20.0
        low_sat_mask = sat <= 70
        bright_mask = (val >= 115) & (val <= 245)

        gradient = cv2.Laplacian(gray, cv2.CV_32F, ksize=3)
        gradient_norm = self._normalize_map(np.abs(gradient))
        soft_edge_mask = gradient_norm <= 0.38

        candidate_mask = neutral_mask & low_sat_mask & bright_mask & soft_edge_mask
        smoke_mask = self._clean_mask(candidate_mask, kernel_size=7)

        warm_mask = self._warm_region_mask(hsv)
        warm_support = self._mask_overlap(smoke_mask, self._dilate_mask(warm_mask, 21))
        coverage_ratio = self._mask_ratio(smoke_mask)
        softness = float(np.mean(1.0 - gradient_norm[smoke_mask > 0])) if np.any(smoke_mask) else 0.0
        neutrality = float(np.mean(neutral_mask[smoke_mask > 0])) if np.any(smoke_mask) else 0.0
        upper_bias = self._upper_region_bias(smoke_mask, top_fraction=0.60)
        upper_focus = self._clip01((upper_bias - 0.55) / 0.25)
        spread_penalty = self._clip01((coverage_ratio - 0.30) / 0.30)
        diffuse_penalty = 0.25 if coverage_ratio > 0.20 and warm_support < 0.02 and upper_focus < 0.50 else 0.0

        score = self._clip01(
            0.35 * min(coverage_ratio / 0.18, 1.0)
            + 0.20 * neutrality
            + 0.15 * softness
            + 0.15 * upper_focus
            + 0.10 * min(warm_support * 3.0, 1.0)
            - 0.25 * spread_penalty
            - diffuse_penalty
        )
        detected = bool(score >= 0.34 and coverage_ratio >= 0.01)

        return DetectorResult(
            name="smoke",
            score=score,
            coverage_ratio=coverage_ratio,
            detected=detected,
            features={
                "warm_support": warm_support,
                "softness": softness,
                "neutrality": neutrality,
                "upper_bias": upper_bias,
                "upper_focus": upper_focus,
                "spread_penalty": spread_penalty,
                "diffuse_penalty": diffuse_penalty,
                "low_saturation_ratio": float(np.mean(low_sat_mask)),
            },
            mask=smoke_mask,
        )

    def detect_dust_haze(
        self,
        image_input: Union[ImageInput, Mapping[str, np.ndarray]],
    ) -> DetectorResult:
        views = (
            image_input
            if isinstance(image_input, Mapping)
            else self._prepare_image_views(image_input)
        )
        bgr = views["bgr"]
        hsv = views["hsv"]
        gray = views["gray"]
        lab = views["lab"]

        sat = hsv[:, :, 1]
        val = hsv[:, :, 2]
        hue = hsv[:, :, 0]
        a_channel = lab[:, :, 1].astype(np.float32)
        b_channel = lab[:, :, 2].astype(np.float32)
        chroma_distance = np.sqrt((a_channel - 128.0) ** 2 + (b_channel - 128.0) ** 2)

        dark_channel = self._dark_channel(bgr, patch_size=15)
        dark_channel_mean = float(np.mean(dark_channel) / 255.0)
        laplacian = cv2.Laplacian(gray, cv2.CV_32F, ksize=3)
        local_contrast = self._normalize_map(np.abs(laplacian))
        low_contrast_mask = local_contrast <= 0.25
        edge_density = float(np.mean(cv2.Canny(gray, 60, 160) > 0))

        haze_like = (sat <= 75) & (val >= 95) & (val <= 245) & (chroma_distance <= 26.0)
        dust_tint = (hue >= 8) & (hue <= 30) & (sat >= 35) & (val >= 40)
        candidate_mask = (haze_like | dust_tint) & low_contrast_mask
        haze_mask = self._clean_mask(candidate_mask, kernel_size=11)

        coverage_ratio = self._mask_ratio(haze_mask)
        contrast_penalty = 1.0 - min(float(np.std(gray)) / 64.0, 1.0)
        saturation_penalty = 1.0 - min(float(np.mean(sat)) / 140.0, 1.0)
        dust_tint_ratio = float(np.mean(dust_tint))
        neutral_haze_ratio = float(np.mean(haze_like))
        appearance_support = max(neutral_haze_ratio, min(dust_tint_ratio * 1.2, 1.0))
        coverage_support = min(coverage_ratio / 0.25, 1.0)
        edge_penalty = min(edge_density / 0.04, 1.0)

        score = self._clip01(
            0.30 * dark_channel_mean
            + 0.20 * contrast_penalty
            + 0.15 * saturation_penalty
            + 0.20 * appearance_support
            + 0.15 * coverage_support
            - 0.25 * edge_penalty
        )
        detected = bool(score >= 0.34 or (coverage_ratio >= 0.25 and score >= 0.25))

        return DetectorResult(
            name="dust_haze",
            score=score,
            coverage_ratio=coverage_ratio,
            detected=detected,
            features={
                "dark_channel_mean": dark_channel_mean,
                "contrast_penalty": contrast_penalty,
                "saturation_penalty": saturation_penalty,
                "dust_tint_ratio": dust_tint_ratio,
                "neutral_haze_ratio": neutral_haze_ratio,
                "appearance_support": appearance_support,
                "edge_density": edge_density,
                "edge_penalty": edge_penalty,
            },
            mask=haze_mask,
        )

    def segment_garbage(
        self,
        image_input: Union[ImageInput, Mapping[str, np.ndarray]],
    ) -> DetectorResult:
        views = (
            image_input
            if isinstance(image_input, Mapping)
            else self._prepare_image_views(image_input)
        )
        bgr = views["bgr"]
        gray = views["gray"]
        lab = views["lab"]

        height, width = gray.shape
        roi_start = int(height * 0.35)
        gray_roi = gray[roi_start:, :]
        lab_roi = lab[roi_start:, :, :].astype(np.float32)

        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9))
        tophat = cv2.morphologyEx(gray_roi, cv2.MORPH_TOPHAT, kernel)
        blackhat = cv2.morphologyEx(gray_roi, cv2.MORPH_BLACKHAT, kernel)
        gradient = cv2.morphologyEx(gray_roi, cv2.MORPH_GRADIENT, kernel)
        edges = cv2.Canny(gray_roi, 60, 160)

        median_lab = np.median(lab_roi.reshape(-1, 3), axis=0)
        lab_distance = np.linalg.norm(lab_roi - median_lab, axis=2)

        clutter_map = (
            0.20 * self._normalize_map(tophat.astype(np.float32))
            + 0.20 * self._normalize_map(blackhat.astype(np.float32))
            + 0.25 * self._normalize_map(gradient.astype(np.float32))
            + 0.20 * self._normalize_map(lab_distance)
            + 0.15 * self._normalize_map(edges.astype(np.float32))
        )

        threshold = max(0.35, float(np.quantile(clutter_map, 0.78)))
        candidate_mask = clutter_map >= threshold
        garbage_roi_mask = self._dilate_mask(candidate_mask.astype(np.uint8), 5)
        garbage_roi_mask = self._clean_mask(garbage_roi_mask, kernel_size=7)
        garbage_roi_mask = self._keep_large_regions(
            garbage_roi_mask,
            min_area=max(80, int(height * width * 0.0006)),
        )

        full_mask = np.zeros_like(gray, dtype=np.uint8)
        full_mask[roi_start:, :] = garbage_roi_mask

        coverage_ratio = self._mask_ratio(full_mask)
        edge_density = float(np.mean(edges > 0))
        masked_pixels = lab_roi[garbage_roi_mask > 0]
        if masked_pixels.size > 0:
            color_variation = min(float(np.std(masked_pixels)) / 35.0, 1.0)
        else:
            color_variation = 0.0
        contour_irregularity = self._contour_irregularity(garbage_roi_mask)
        coverage_support = min(coverage_ratio / 0.12, 1.0)
        edge_support = min(edge_density / 0.08, 1.0)

        score = self._clip01(
            0.50 * coverage_support
            + 0.30 * edge_support
            + 0.10 * color_variation
            + 0.10 * contour_irregularity
        )
        detected = bool(score >= 0.32 and coverage_ratio >= 0.01)

        return DetectorResult(
            name="garbage_accumulation",
            score=score,
            coverage_ratio=coverage_ratio,
            detected=detected,
            features={
                "edge_density": edge_density,
                "color_variation": color_variation,
                "contour_irregularity": contour_irregularity,
                "coverage_support": coverage_support,
                "edge_support": edge_support,
                "roi_start_ratio": roi_start / float(height),
            },
            mask=full_mask,
        )

    def detect_water_contamination(
        self,
        image_input: Union[ImageInput, Mapping[str, np.ndarray]],
    ) -> DetectorResult:
        views = (
            image_input
            if isinstance(image_input, Mapping)
            else self._prepare_image_views(image_input)
        )
        hsv = views["hsv"]
        gray = views["gray"]

        hue = hsv[:, :, 0]
        sat = hsv[:, :, 1]
        val = hsv[:, :, 2]

        green_algae = (hue >= 35) & (hue <= 92) & (sat >= 50) & (val >= 35) & (val <= 155)
        chemical_tint = (hue >= 96) & (hue <= 125) & (sat >= 45) & (val >= 45) & (val <= 165)
        dark_stagnant = (val <= 75) & (sat <= 95)
        foam_like = (sat <= 45) & (val >= 180)
        smooth_surface = cv2.GaussianBlur(gray, (9, 9), 0)
        local_delta = cv2.absdiff(gray, smooth_surface)
        low_texture = local_delta <= 22

        candidate_mask = (green_algae | chemical_tint | dark_stagnant | foam_like) & low_texture
        water_mask = self._clean_mask(candidate_mask, kernel_size=9)

        coverage_ratio = self._mask_ratio(water_mask)
        algae_ratio = float(np.mean(green_algae))
        chemical_ratio = float(np.mean(chemical_tint))
        dark_ratio = float(np.mean(dark_stagnant))
        foam_ratio = float(np.mean(foam_like))
        low_texture_ratio = float(np.mean(low_texture))

        score = self._clip01(
            0.40 * min(coverage_ratio / 0.30, 1.0)
            + 0.16 * min(algae_ratio / 0.22, 1.0)
            + 0.14 * min(chemical_ratio / 0.16, 1.0)
            + 0.18 * min(dark_ratio / 0.35, 1.0)
            + 0.07 * min(foam_ratio / 0.08, 1.0)
            + 0.05 * low_texture_ratio
        )
        detected = bool(score >= 0.34 and coverage_ratio >= 0.03)

        return DetectorResult(
            name="water_contamination",
            score=score,
            coverage_ratio=coverage_ratio,
            detected=detected,
            features={
                "algae_ratio": algae_ratio,
                "chemical_tint_ratio": chemical_ratio,
                "dark_stagnant_ratio": dark_ratio,
                "foam_ratio": foam_ratio,
                "low_texture_ratio": low_texture_ratio,
            },
            mask=water_mask,
        )

    def detect_wastewater_sewerage(
        self,
        image_input: Union[ImageInput, Mapping[str, np.ndarray]],
    ) -> DetectorResult:
        views = (
            image_input
            if isinstance(image_input, Mapping)
            else self._prepare_image_views(image_input)
        )
        hsv = views["hsv"]
        gray = views["gray"]

        height, width = gray.shape
        roi_start = int(height * 0.38)
        hsv_roi = hsv[roi_start:, :, :]
        gray_roi = gray[roi_start:, :]

        hue = hsv_roi[:, :, 0]
        sat = hsv_roi[:, :, 1]
        val = hsv_roi[:, :, 2]

        blackwater = (val <= 80) & (sat <= 110)
        sewage_brown = (hue >= 8) & (hue <= 32) & (sat >= 35) & (val <= 150)
        green_sludge = (hue >= 35) & (hue <= 88) & (sat >= 50) & (val <= 165)
        slick_surface = cv2.GaussianBlur(gray_roi, (9, 9), 0)
        local_delta = cv2.absdiff(gray_roi, slick_surface)
        stagnant_texture = local_delta <= 18

        candidate_roi = (blackwater | sewage_brown | green_sludge) & stagnant_texture
        sewerage_roi_mask = self._clean_mask(candidate_roi, kernel_size=11)
        sewerage_roi_mask = self._keep_large_regions(
            sewerage_roi_mask,
            min_area=max(80, int(height * width * 0.0008)),
        )

        full_mask = np.zeros_like(gray, dtype=np.uint8)
        full_mask[roi_start:, :] = sewerage_roi_mask

        coverage_ratio = self._mask_ratio(full_mask)
        blackwater_ratio = float(np.mean(blackwater))
        brown_ratio = float(np.mean(sewage_brown))
        green_sludge_ratio = float(np.mean(green_sludge))
        stagnant_ratio = float(np.mean(stagnant_texture))
        lower_bias = self._lower_region_bias(full_mask, bottom_fraction=0.62)

        score = self._clip01(
            0.30 * min(coverage_ratio / 0.22, 1.0)
            + 0.25 * min(blackwater_ratio / 0.35, 1.0)
            + 0.18 * min(brown_ratio / 0.16, 1.0)
            + 0.12 * min(green_sludge_ratio / 0.12, 1.0)
            + 0.10 * stagnant_ratio
            + 0.05 * lower_bias
        )
        detected = bool(score >= 0.34 and coverage_ratio >= 0.02)

        return DetectorResult(
            name="wastewater_sewerage",
            score=score,
            coverage_ratio=coverage_ratio,
            detected=detected,
            features={
                "blackwater_ratio": blackwater_ratio,
                "brown_ratio": brown_ratio,
                "green_sludge_ratio": green_sludge_ratio,
                "stagnant_ratio": stagnant_ratio,
                "lower_bias": lower_bias,
                "roi_start_ratio": roi_start / float(height),
            },
            mask=full_mask,
        )

    def compute_image_severity(
        self,
        detectors: Mapping[str, DetectorResult],
        color_features: Mapping[str, float],
        texture_features: Mapping[str, float],
    ) -> float:
        smoke_score = self._effective_detector_score(detectors["smoke"])
        dust_score = self._effective_detector_score(detectors["dust_haze"])
        garbage_score = self._effective_detector_score(detectors["garbage_accumulation"])
        water_score = self._effective_detector_score(detectors["water_contamination"])
        wastewater_score = self._effective_detector_score(detectors["wastewater_sewerage"])

        weighted_signal = (
            0.25 * smoke_score
            + 0.20 * dust_score
            + 0.20 * garbage_score
            + 0.18 * water_score
            + 0.17 * wastewater_score
        )
        dominant_signal = max(
            smoke_score,
            dust_score,
            garbage_score,
            water_score,
            wastewater_score,
        )
        texture_bonus = self._clip01(
            min(texture_features["glcm_contrast"] / 12.0, 1.0) * 0.6
            + min(texture_features["lbp_entropy"] / 3.5, 1.0) * 0.4
        )
        visual_pollution_bonus = self._clip01(
            0.5 * color_features["brown_ratio"] + 0.5 * color_features["warm_ratio"]
        )

        raw_score = (
            0.60 * dominant_signal
            + 0.25 * weighted_signal
            + 0.10 * texture_bonus
            + 0.05 * visual_pollution_bonus
        )
        return round(self._clip01(raw_score) * 100.0, 2)

    def _prepare_image_views(self, image_input: ImageInput) -> Dict[str, np.ndarray]:
        bgr = self._load_image(image_input)
        bgr = self._resize_if_needed(bgr)
        hsv = cv2.cvtColor(bgr, cv2.COLOR_BGR2HSV)
        gray = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)
        lab = cv2.cvtColor(bgr, cv2.COLOR_BGR2LAB)
        return {
            "bgr": bgr,
            "hsv": hsv,
            "gray": gray,
            "lab": lab,
        }

    def _load_image(self, image_input: ImageInput) -> np.ndarray:
        if isinstance(image_input, np.ndarray):
            array = image_input
            if array.ndim == 2:
                return cv2.cvtColor(array.astype(np.uint8), cv2.COLOR_GRAY2BGR)
            if array.ndim == 3 and array.shape[2] == 3:
                return array.astype(np.uint8)
            raise ValueError("NumPy image input must be HxW or HxWx3.")

        if isinstance(image_input, (str, Path)):
            image = cv2.imread(str(image_input), cv2.IMREAD_COLOR)
            if image is None:
                raise ValueError(f"Unable to read image from path: {image_input}")
            return image

        if isinstance(image_input, bytes):
            np_buffer = np.frombuffer(image_input, dtype=np.uint8)
            image = cv2.imdecode(np_buffer, cv2.IMREAD_COLOR)
            if image is None:
                raise ValueError("Unable to decode image bytes.")
            return image

        raise TypeError("Unsupported image input type.")

    def _resize_if_needed(self, bgr: np.ndarray) -> np.ndarray:
        height, width = bgr.shape[:2]
        max_dimension = max(height, width)
        if max_dimension <= self.MAX_DIMENSION:
            return bgr
        scale = self.MAX_DIMENSION / float(max_dimension)
        return cv2.resize(
            bgr,
            (int(width * scale), int(height * scale)),
            interpolation=cv2.INTER_AREA,
        )

    def _warm_region_mask(self, hsv: np.ndarray) -> np.ndarray:
        hue = hsv[:, :, 0]
        sat = hsv[:, :, 1]
        val = hsv[:, :, 2]
        warm_mask = (((hue <= 25) | (hue >= 170)) & (sat >= 100) & (val >= 120)).astype(np.uint8)
        return self._clean_mask(warm_mask, kernel_size=5)

    def _dark_channel(self, bgr: np.ndarray, patch_size: int) -> np.ndarray:
        min_channel = np.min(bgr, axis=2).astype(np.uint8)
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (patch_size, patch_size))
        return cv2.erode(min_channel, kernel)

    def _clean_mask(self, mask: np.ndarray, kernel_size: int) -> np.ndarray:
        uint_mask = (mask > 0).astype(np.uint8)
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (kernel_size, kernel_size))
        cleaned = cv2.morphologyEx(uint_mask, cv2.MORPH_OPEN, kernel)
        cleaned = cv2.morphologyEx(cleaned, cv2.MORPH_CLOSE, kernel)
        return cleaned

    def _keep_large_regions(self, mask: np.ndarray, min_area: int) -> np.ndarray:
        contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        filtered = np.zeros_like(mask, dtype=np.uint8)
        for contour in contours:
            area = cv2.contourArea(contour)
            if area >= min_area:
                cv2.drawContours(filtered, [contour], -1, 1, thickness=cv2.FILLED)
        return filtered

    def _contour_irregularity(self, mask: np.ndarray) -> float:
        contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        if not contours:
            return 0.0

        irregularities = []
        for contour in contours:
            area = cv2.contourArea(contour)
            perimeter = cv2.arcLength(contour, True)
            if area <= 0 or perimeter <= 0:
                continue
            circularity = float((4.0 * np.pi * area) / (perimeter * perimeter))
            irregularities.append(1.0 - min(circularity, 1.0))

        if not irregularities:
            return 0.0
        return float(np.mean(irregularities))

    def _dilate_mask(self, mask: np.ndarray, kernel_size: int) -> np.ndarray:
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (kernel_size, kernel_size))
        return cv2.dilate((mask > 0).astype(np.uint8), kernel, iterations=1)

    def _mask_ratio(self, mask: np.ndarray) -> float:
        return float(np.mean(mask > 0))

    def _mask_overlap(self, mask_a: np.ndarray, mask_b: np.ndarray) -> float:
        area_a = np.sum(mask_a > 0)
        if area_a == 0:
            return 0.0
        overlap = np.sum((mask_a > 0) & (mask_b > 0))
        return float(overlap / area_a)

    def _upper_region_bias(self, mask: np.ndarray, top_fraction: float) -> float:
        total_pixels = np.sum(mask > 0)
        if total_pixels == 0:
            return 0.0
        top_rows = max(1, int(mask.shape[0] * top_fraction))
        top_pixels = np.sum(mask[:top_rows, :] > 0)
        return float(top_pixels / total_pixels)

    def _lower_region_bias(self, mask: np.ndarray, bottom_fraction: float) -> float:
        total_pixels = np.sum(mask > 0)
        if total_pixels == 0:
            return 0.0
        start_row = max(0, int(mask.shape[0] * (1.0 - bottom_fraction)))
        bottom_pixels = np.sum(mask[start_row:, :] > 0)
        return float(bottom_pixels / total_pixels)

    def _normalize_map(self, map_array: np.ndarray) -> np.ndarray:
        map_array = map_array.astype(np.float32)
        min_value = float(np.min(map_array))
        max_value = float(np.max(map_array))
        if max_value - min_value < 1e-6:
            return np.zeros_like(map_array, dtype=np.float32)
        return (map_array - min_value) / (max_value - min_value)

    def _effective_detector_score(self, detector: DetectorResult) -> float:
        if detector.detected:
            return detector.score
        return detector.score * 0.35

    def _select_dominant_type(
        self,
        detectors: Mapping[str, DetectorResult],
        category_name: Optional[str],
    ) -> str:
        normalized_category = (category_name or "").lower()
        category_preferences = []
        if any(token in normalized_category for token in ["sewer", "sewage", "wastewater", "drain"]):
            category_preferences = ["wastewater_sewerage", "water_contamination"]
        elif any(token in normalized_category for token in ["water", "contamination", "chemical"]):
            category_preferences = ["water_contamination", "wastewater_sewerage"]
        elif any(token in normalized_category for token in ["waste", "garbage", "dump", "land"]):
            category_preferences = ["garbage_accumulation"]
        elif any(token in normalized_category for token in ["air", "smoke", "dust", "aqi", "quality"]):
            category_preferences = ["smoke", "dust_haze"]

        preferred = [
            detectors[name]
            for name in category_preferences
            if name in detectors and detectors[name].score >= 0.30
        ]
        if preferred:
            return max(preferred, key=lambda item: item.score).name

        return max(detectors.values(), key=lambda item: item.score).name

    def _severity_label(self, severity_score: float) -> str:
        if severity_score < 30.0:
            return "Normal"
        if severity_score < 50.0:
            return "Moderate"
        if severity_score < 75.0:
            return "High"
        return "Critical"

    def _ai_confidence_proxy(
        self,
        detectors: Mapping[str, DetectorResult],
        dominant_type: str,
        category_name: Optional[str],
    ) -> float:
        ordered_scores = sorted((detector.score for detector in detectors.values()), reverse=True)
        dominant_score = ordered_scores[0] if ordered_scores else 0.0
        runner_up = ordered_scores[1] if len(ordered_scores) > 1 else 0.0
        margin = self._clip01((dominant_score - runner_up + 0.20) / 0.55)

        category_bonus = 0.0
        normalized_category = (category_name or "").lower()
        category_groups = {
            "smoke": ["air", "smoke", "aqi", "quality", "burning"],
            "dust_haze": ["air", "dust", "construction", "aqi", "quality"],
            "garbage_accumulation": ["waste", "garbage", "land", "dump", "solid"],
            "water_contamination": ["water", "contamination", "chemical"],
            "wastewater_sewerage": ["sewer", "sewage", "wastewater", "drain"],
        }
        if any(token in normalized_category for token in category_groups.get(dominant_type, [])):
            category_bonus = 0.15

        confidence = 100.0 * self._clip01(
            0.65 * dominant_score
            + 0.20 * margin
            + category_bonus
        )
        return round(confidence, 2)

    def _clip01(self, value: float) -> float:
        return float(max(0.0, min(1.0, value)))


pollution_image_service = PollutionImageService()


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Run classical image-based pollution detection on a single image."
    )
    parser.add_argument(
        "image_path",
        help="Path to the image file to analyze.",
    )
    parser.add_argument(
        "--pretty",
        action="store_true",
        help="Pretty-print the JSON output.",
    )
    args = parser.parse_args()

    result = pollution_image_service.detect_pollution(args.image_path)
    if args.pretty:
        print(json.dumps(result, indent=2))
    else:
        print(json.dumps(result))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
