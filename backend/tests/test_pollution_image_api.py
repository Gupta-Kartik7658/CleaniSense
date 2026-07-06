import os
import sys
import unittest

import cv2
import numpy as np
from fastapi.testclient import TestClient


sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import app


client = TestClient(app)


class TestPollutionImageAPI(unittest.TestCase):
    def test_analyze_pollution_image_returns_summary(self):
        image = np.zeros((360, 480, 3), dtype=np.uint8)
        image[:, :] = (210, 170, 120)
        cv2.rectangle(image, (190, 250), (290, 340), (40, 90, 230), thickness=cv2.FILLED)

        overlay = image.copy()
        for center, radius in [((210, 190), 55), ((250, 150), 65), ((290, 200), 50)]:
            cv2.circle(overlay, center, radius, (180, 180, 180), thickness=cv2.FILLED)
        image = cv2.addWeighted(overlay, 0.55, image, 0.45, 0)

        ok, encoded = cv2.imencode(".png", image)
        self.assertTrue(ok)

        response = client.post(
            "/api/v1/image-analysis/analyze",
            files={"file": ("smoke.png", encoded.tobytes(), "image/png")},
        )

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertTrue(payload["success"])
        self.assertEqual(payload["data"]["summary"]["dominant_type"], "smoke")
        self.assertGreater(payload["data"]["summary"]["severity_score"], 30.0)

    def test_analyze_pollution_image_rejects_non_image_file(self):
        response = client.post(
            "/api/v1/image-analysis/analyze",
            files={"file": ("notes.txt", b"not an image", "text/plain")},
        )

        self.assertEqual(response.status_code, 400)
        payload = response.json()
        self.assertFalse(payload["success"])
        self.assertIn("not supported for image analysis", payload["message"])


if __name__ == "__main__":
    unittest.main()
