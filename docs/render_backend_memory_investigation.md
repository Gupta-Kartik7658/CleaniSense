# Render Backend Memory Investigation

Date: 2026-07-19

## Finding

The most likely cause of Render memory-limit crashes is startup-time loading of native image-processing dependencies.

`app.main` imports `app.api.v1.api_router`, which imports every router, including `image_analysis.py`. That router imports `pollution_image_service`, and `pollution_image_service.py` imports:

- `cv2`
- `numpy`
- `skimage.feature`

This means OpenCV, NumPy/OpenBLAS, SciPy, and scikit-image can load into memory as soon as the API process starts, even if no image-analysis request is being served.

## Local Dependency Footprint

Largest relevant installed package folders in the backend virtual environment:

| Dependency | Approx. Size |
|---|---:|
| `cv2` | 112 MB |
| `scipy` | 109 MB |
| `numpy` | 31 MB |
| `numpy.libs` | 20 MB |
| `scipy.libs` | 19 MB |
| `skimage` | 23 MB |
| `grpc` | 12 MB |

These sizes are not equal to runtime RAM usage, but they are a strong indicator that the image-processing stack is the dominant memory-heavy part of the backend.

## Additional Pressure Points

- OpenCV creates multiple full-image arrays during analysis: BGR, HSV, grayscale, LAB, masks, morphology outputs, edges, gradients, and texture matrices.
- `scikit-image` pulls in SciPy-related native libraries.
- `POST /api/v1/complaints` reads every uploaded attachment into `raw_files` in memory before the background verification task starts. With several images, the process can hold all original image bytes and then allocate OpenCV arrays during analysis.
- The backend start command currently runs a single Uvicorn process, but Render memory can still be exceeded by native dependency loading plus request-time image arrays.
- The app seeds and syncs database schema during startup, but those are less likely to dominate memory compared with OpenCV/SciPy native imports.

## Not Changed Yet

No memory optimization was applied in this pass. Possible future fixes include lazy-importing the image-analysis router/service, moving image analysis into a separate worker/service, removing `scikit-image`, compressing/resizing uploaded images before OpenCV/Gemini, or making image analysis optional on low-memory deployments.
