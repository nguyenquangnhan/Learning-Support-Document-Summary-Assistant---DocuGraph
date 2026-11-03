"""
DocuGraph AI – OCR Service
Wraps PaddleOCR for Vietnamese text recognition.
"""
from paddleocr import PaddleOCR
import numpy as np

# Initialize once (downloads models on first run)
_ocr = None


def get_ocr() -> PaddleOCR:
    global _ocr
    if _ocr is None:
        _ocr = PaddleOCR(
            use_angle_cls=True,   # auto-rotate pages
            lang="vi",            # Vietnamese language model
            use_gpu=False,        # set True if CUDA available
            show_log=False,
        )
    return _ocr


def ocr_image(image: np.ndarray) -> str:
    """Run PaddleOCR on a single image array, return extracted text."""
    ocr = get_ocr()
    results = ocr.ocr(image, cls=True)
    lines = []
    if results and results[0]:
        for line in results[0]:
            text, confidence = line[1]
            if confidence > 0.5:
                lines.append(text)
    return "\n".join(lines)

