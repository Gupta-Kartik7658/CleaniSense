# Hybrid Image Severity Matrix

Gemini is treated as the semantic source of truth. OpenCV is used only as a corroborating visual signal.

Coverage: `75/105` category checks returned usable Gemini results. `25` checks hit Gemini quota/rate limits.

A score of `0.00` means Gemini returned successfully and did not verify that image as the requested pollution type. `QTA` means Gemini quota/rate limit blocked that cell. `ERR` means local analysis failed.

| Image | Smoke | Dust/Haze | Garbage | Water | Wastewater | Best Match |
| --- | --- | --- | --- | --- | --- | --- |
| <img src="../images/_120349943_gettyimages-863388332.jpg" alt="_120349943_gettyimages-863388332.jpg" width="120"><br>_120349943_gettyimages-863388332.jpg | 0.00 | 76.98 | 0.00 | 0.00 | 0.00 | dust_haze (76.98) |
| <img src="../images/delhiairpollutionimage_667b82c6342d4.jpg" alt="delhiairpollutionimage_667b82c6342d4.jpg" width="120"><br>delhiairpollutionimage_667b82c6342d4.jpg | 0.00 | 59.84 | 0.00 | 0.00 | 0.00 | dust_haze (59.84) |
| <img src="../images/images%20%281%29.jpg" alt="images (1).jpg" width="120"><br>images (1).jpg | 73.61 | 0.00 | 0.00 | 0.00 | 0.00 | smoke (73.61) |
| <img src="../images/images%20%2810%29.jpg" alt="images (10).jpg" width="120"><br>images (10).jpg | QTA | QTA | QTA | QTA | 83.96 | wastewater_sewerage (83.96) |
| <img src="../images/images%20%2811%29.jpg" alt="images (11).jpg" width="120"><br>images (11).jpg | 0.00 | 0.00 | 0.00 | 0.00 | 84.05 | wastewater_sewerage (84.05) |
| <img src="../images/images%20%2812%29.jpg" alt="images (12).jpg" width="120"><br>images (12).jpg | 0.00 | 0.00 | 88.13 | 0.00 | 0.00 | garbage_accumulation (88.13) |
| <img src="../images/images%20%2813%29.jpg" alt="images (13).jpg" width="120"><br>images (13).jpg | 0.00 | 0.00 | 0.00 | 0.00 | 0.00 | none |
| <img src="../images/images%20%2814%29.jpg" alt="images (14).jpg" width="120"><br>images (14).jpg | 0.00 | 0.00 | QTA | QTA | QTA | none |
| <img src="../images/images%20%2815%29.jpg" alt="images (15).jpg" width="120"><br>images (15).jpg | QTA | QTA | QTA | QTA | 0.00 | none |
| <img src="../images/images%20%2816%29.jpg" alt="images (16).jpg" width="120"><br>images (16).jpg | 0.00 | 0.00 | 0.00 | 0.00 | 0.00 | none |
| <img src="../images/images%20%282%29.jpg" alt="images (2).jpg" width="120"><br>images (2).jpg | 78.91 | 0.00 | 0.00 | 0.00 | 0.00 | smoke (78.91) |
| <img src="../images/images%20%283%29.jpg" alt="images (3).jpg" width="120"><br>images (3).jpg | 0.00 | 0.00 | 92.31 | 0.00 | 0.00 | garbage_accumulation (92.31) |
| <img src="../images/images%20%284%29.jpg" alt="images (4).jpg" width="120"><br>images (4).jpg | QTA | 0.00 | QTA | QTA | QTA | none |
| <img src="../images/images%20%285%29.jpg" alt="images (5).jpg" width="120"><br>images (5).jpg | QTA | QTA | 83.68 | 0.00 | 0.00 | garbage_accumulation (83.68) |
| <img src="../images/images%20%286%29.jpg" alt="images (6).jpg" width="120"><br>images (6).jpg | 0.00 | 0.00 | 86.82 | 0.00 | 0.00 | garbage_accumulation (86.82) |
| <img src="../images/images%20%287%29.jpg" alt="images (7).jpg" width="120"><br>images (7).jpg | 0.00 | 0.00 | 79.31 | 0.00 | 0.00 | garbage_accumulation (79.31) |
| <img src="../images/images%20%288%29.jpg" alt="images (8).jpg" width="120"><br>images (8).jpg | 0.00 | 0.00 | 0.00 | QTA | 0.00 | none |
| <img src="../images/images%20%289%29.jpg" alt="images (9).jpg" width="120"><br>images (9).jpg | QTA | QTA | QTA | QTA | QTA | none |
| <img src="../images/images.jpg" alt="images.jpg" width="120"><br>images.jpg | QTA | QTA | 0.00 | 0.00 | 0.00 | none |
| <img src="../images/images.png" alt="images.png" width="120"><br>images.png | 0.00 | 0.00 | 0.00 | 0.00 | 0.00 | none |
| <img src="../images/ngt-issues-notice-to-up-after-report-on-water-contamination.avif" alt="ngt-issues-notice-to-up-after-report-on-water-contamination.avif" width="120"><br>ngt-issues-notice-to-up-after-report-on-water-contamination.avif | ERR | ERR | ERR | ERR | ERR | none |

## Notes

- Detailed per-image raw OpenCV and Gemini fields are stored in `outputs/hybrid_image_severity_matrix.json`.
- `noise_pollution` is excluded because still images cannot verify noise.
- `other` is excluded from the comparison table because it is a fallback bucket, not a visual pollution class.
- Gemini failures are recorded in the JSON as `gemini_skipped_reason`.

## Gemini Failures

| Image | Category | Reason |
| --- | --- | --- |
| images (10).jpg | smoke | Gemini HTTP 429: {   "error": {     "code": 429,     "message": "You exceeded your current quota, please check your plan and billing details. For more information on this error, he |
| images (10).jpg | dust_haze | Gemini HTTP 429: {   "error": {     "code": 429,     "message": "You exceeded your current quota, please check your plan and billing details. For more information on this error, he |
| images (10).jpg | garbage_accumulation | Gemini HTTP 429: {   "error": {     "code": 429,     "message": "You exceeded your current quota, please check your plan and billing details. For more information on this error, he |
| images (10).jpg | water_contamination | Gemini HTTP 429: {   "error": {     "code": 429,     "message": "You exceeded your current quota, please check your plan and billing details. For more information on this error, he |
| images (14).jpg | garbage_accumulation | Gemini HTTP 429: {   "error": {     "code": 429,     "message": "You exceeded your current quota, please check your plan and billing details. For more information on this error, he |
| images (14).jpg | water_contamination | Gemini HTTP 429: {   "error": {     "code": 429,     "message": "You exceeded your current quota, please check your plan and billing details. For more information on this error, he |
| images (14).jpg | wastewater_sewerage | Gemini HTTP 429: {   "error": {     "code": 429,     "message": "You exceeded your current quota, please check your plan and billing details. For more information on this error, he |
| images (15).jpg | smoke | Gemini HTTP 429: {   "error": {     "code": 429,     "message": "You exceeded your current quota, please check your plan and billing details. For more information on this error, he |
| images (15).jpg | dust_haze | Gemini HTTP 429: {   "error": {     "code": 429,     "message": "You exceeded your current quota, please check your plan and billing details. For more information on this error, he |
| images (15).jpg | garbage_accumulation | Gemini HTTP 429: {   "error": {     "code": 429,     "message": "You exceeded your current quota, please check your plan and billing details. For more information on this error, he |
| images (15).jpg | water_contamination | Gemini HTTP 429: {   "error": {     "code": 429,     "message": "You exceeded your current quota, please check your plan and billing details. For more information on this error, he |
| images (4).jpg | smoke | Gemini HTTP 429: {   "error": {     "code": 429,     "message": "You exceeded your current quota, please check your plan and billing details. For more information on this error, he |
| images (4).jpg | garbage_accumulation | Gemini HTTP 429: {   "error": {     "code": 429,     "message": "You exceeded your current quota, please check your plan and billing details. For more information on this error, he |
| images (4).jpg | water_contamination | Gemini HTTP 429: {   "error": {     "code": 429,     "message": "You exceeded your current quota, please check your plan and billing details. For more information on this error, he |
| images (4).jpg | wastewater_sewerage | Gemini HTTP 429: {   "error": {     "code": 429,     "message": "You exceeded your current quota, please check your plan and billing details. For more information on this error, he |
| images (5).jpg | smoke | Gemini HTTP 429: {   "error": {     "code": 429,     "message": "You exceeded your current quota, please check your plan and billing details. For more information on this error, he |
| images (5).jpg | dust_haze | Gemini HTTP 429: {   "error": {     "code": 429,     "message": "You exceeded your current quota, please check your plan and billing details. For more information on this error, he |
| images (8).jpg | water_contamination | Gemini HTTP 429: {   "error": {     "code": 429,     "message": "You exceeded your current quota, please check your plan and billing details. For more information on this error, he |
| images (9).jpg | smoke | Gemini HTTP 429: {   "error": {     "code": 429,     "message": "You exceeded your current quota, please check your plan and billing details. For more information on this error, he |
| images (9).jpg | dust_haze | Gemini HTTP 429: {   "error": {     "code": 429,     "message": "You exceeded your current quota, please check your plan and billing details. For more information on this error, he |
| images (9).jpg | garbage_accumulation | Gemini HTTP 429: {   "error": {     "code": 429,     "message": "You exceeded your current quota, please check your plan and billing details. For more information on this error, he |
| images (9).jpg | water_contamination | Gemini HTTP 429: {   "error": {     "code": 429,     "message": "You exceeded your current quota, please check your plan and billing details. For more information on this error, he |
| images (9).jpg | wastewater_sewerage | Gemini HTTP 429: {   "error": {     "code": 429,     "message": "You exceeded your current quota, please check your plan and billing details. For more information on this error, he |
| images.jpg | smoke | Gemini HTTP 429: {   "error": {     "code": 429,     "message": "You exceeded your current quota, please check your plan and billing details. For more information on this error, he |
| images.jpg | dust_haze | Gemini HTTP 429: {   "error": {     "code": 429,     "message": "You exceeded your current quota, please check your plan and billing details. For more information on this error, he |
| ngt-issues-notice-to-up-after-report-on-water-contamination.avif | smoke | ValueError: Unable to decode image bytes. |
| ngt-issues-notice-to-up-after-report-on-water-contamination.avif | dust_haze | ValueError: Unable to decode image bytes. |
| ngt-issues-notice-to-up-after-report-on-water-contamination.avif | garbage_accumulation | ValueError: Unable to decode image bytes. |
| ngt-issues-notice-to-up-after-report-on-water-contamination.avif | water_contamination | ValueError: Unable to decode image bytes. |
| ngt-issues-notice-to-up-after-report-on-water-contamination.avif | wastewater_sewerage | ValueError: Unable to decode image bytes. |
