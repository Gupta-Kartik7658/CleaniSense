import math
from typing import List, Any, Dict
from pydantic import BaseModel

class PaginatedResponseModel(BaseModel):
    items: List[Any]
    total: int
    page: int
    page_size: int
    total_pages: int
    has_next: bool
    has_previous: bool

def paginate(query, page: int, page_size: int) -> Dict[str, Any]:
    """
    Paginate a SQLAlchemy query and return a dict formatted for the standard envelope.
    """
    if page < 1:
        page = 1
    if page_size < 1:
        page_size = 20
    elif page_size > 100:
        page_size = 100

    total = query.count()
    total_pages = math.ceil(total / page_size) if total > 0 else 0
    
    offset = (page - 1) * page_size
    items = query.offset(offset).limit(page_size).all()
    
    has_next = page < total_pages
    has_previous = page > 1
    
    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
        "has_next": has_next,
        "has_previous": has_previous
    }
