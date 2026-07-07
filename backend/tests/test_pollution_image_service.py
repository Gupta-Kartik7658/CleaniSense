import os
import sys
import unittest

import cv2
import numpy as np


sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.services.pollution_image_service import PollutionImageService


class TestPollutionImageService(unittest.TestCase):
    def setUp(self):
        self.service = PollutionImageService()
        self.rng = np.random.default_rng(42)

    def test_clean_scene_stays_low_signal(self):
        image = np.zeros((320, 480, 3), dtype=np.uint8)
        image[:160, :] = (210, 180, 110)
        image[160:, :] = (110, 170, 110)

        result = self.service.analyze(image)

        self.assertFalse(result.pollution_detected)
        self.assertEqual(result.dominant_type, "low_signal")
        self.assertEqual(result.primary_category, "Other")
        self.assertLess(result.severity_score, 30.0)

    def test_smoke_scene_prefers_smoke_detector(self):
        image = np.zeros((360, 480, 3), dtype=np.uint8)
        image[:, :] = (210, 170, 120)
        cv2.rectangle(image, (190, 250), (290, 340), (40, 90, 230), thickness=cv2.FILLED)

        overlay = image.copy()
        for center, radius in [((210, 190), 55), ((250, 150), 65), ((290, 200), 50)]:
            cv2.circle(overlay, center, radius, (180, 180, 180), thickness=cv2.FILLED)
        image = cv2.addWeighted(overlay, 0.55, image, 0.45, 0)

        result = self.service.analyze(image)

        self.assertEqual(result.dominant_type, "smoke")
        self.assertEqual(result.primary_category, "Air Pollution")
        self.assertGreater(result.detectors["smoke"].score, 0.35)

    def test_dust_scene_prefers_dust_haze_detector(self):
        base = np.zeros((320, 480, 3), dtype=np.uint8)
        for index in range(0, 480, 40):
            color = (50 + index // 8, 60 + index // 10, 70 + index // 12)
            cv2.rectangle(base, (index, 0), (index + 20, 319), color, thickness=cv2.FILLED)

        haze = np.full_like(base, (145, 160, 175))
        image = cv2.addWeighted(base, 0.35, haze, 0.65, 0)
        image = cv2.GaussianBlur(image, (11, 11), 0)

        result = self.service.analyze(image)

        self.assertEqual(result.dominant_type, "dust_haze")
        self.assertEqual(result.primary_category, "Air Quality Control")
        self.assertGreater(result.detectors["dust_haze"].score, 0.35)

    def test_garbage_scene_prefers_garbage_detector(self):
        image = np.zeros((360, 480, 3), dtype=np.uint8)
        image[:120, :] = (185, 170, 150)
        image[120:, :] = (95, 125, 110)

        for _ in range(35):
            x = int(self.rng.integers(20, 440))
            y = int(self.rng.integers(190, 330))
            width = int(self.rng.integers(12, 35))
            height = int(self.rng.integers(8, 24))
            color = tuple(int(value) for value in self.rng.integers(20, 240, size=3))
            cv2.rectangle(
                image,
                (x, y),
                (min(x + width, 479), min(y + height, 359)),
                color,
                thickness=cv2.FILLED,
            )
            cv2.rectangle(
                image,
                (x, y),
                (min(x + width, 479), min(y + height, 359)),
                (20, 20, 20),
                thickness=1,
            )

        result = self.service.analyze(image)

        self.assertEqual(result.dominant_type, "garbage_accumulation")
        self.assertEqual(result.primary_category, "Waste Management")
        self.assertGreater(result.detectors["garbage_accumulation"].score, 0.30)

    def test_wastewater_scene_prefers_wastewater_detector(self):
        image = np.full((360, 480, 3), (150, 165, 150), dtype=np.uint8)
        cv2.rectangle(image, (0, 220), (479, 359), (95, 110, 100), thickness=cv2.FILLED)

        for center, axes in [((140, 290), (75, 32)), ((280, 305), (92, 36)), ((385, 275), (52, 24))]:
            cv2.ellipse(image, center, axes, 0, 0, 360, (55, 85, 90), thickness=cv2.FILLED)
            cv2.ellipse(image, center, axes, 0, 0, 360, (35, 55, 60), thickness=2)

        cv2.line(image, (65, 250), (205, 250), (180, 185, 178), thickness=3)
        cv2.line(image, (245, 285), (410, 285), (170, 178, 170), thickness=2)

        result = self.service.analyze(image)

        self.assertEqual(result.dominant_type, "wastewater_sewerage")
        self.assertEqual(result.primary_category, "Wastewater / Sewerage")
        self.assertGreater(result.detectors["wastewater_sewerage"].score, 0.30)

    def test_water_contamination_scene_prefers_water_contamination_detector(self):
        image = np.full((360, 480, 3), (170, 185, 185), dtype=np.uint8)
        cv2.rectangle(image, (0, 180), (479, 359), (115, 150, 95), thickness=cv2.FILLED)

        for center, axes, color in [
            ((120, 270), (80, 48), (70, 120, 80)),
            ((255, 255), (95, 55), (55, 105, 68)),
            ((375, 295), (70, 42), (65, 115, 75)),
        ]:
            cv2.ellipse(image, center, axes, 0, 0, 360, color, thickness=cv2.FILLED)

        for center, radius in [((150, 250), 14), ((205, 295), 11), ((320, 270), 15), ((390, 305), 10)]:
            cv2.circle(image, center, radius, (225, 235, 225), thickness=cv2.FILLED)

        result = self.service.analyze(image)

        self.assertEqual(result.dominant_type, "water_contamination")
        self.assertEqual(result.primary_category, "Water Contamination")
        self.assertGreater(result.detectors["water_contamination"].score, 0.30)


if __name__ == "__main__":
    unittest.main()
