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
        self.assertGreater(result.detectors["garbage_accumulation"].score, 0.30)


if __name__ == "__main__":
    unittest.main()
