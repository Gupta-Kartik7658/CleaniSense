import logging

from sqlalchemy import inspect, text


logger = logging.getLogger("uvicorn")


COMPLAINT_OPTIONAL_COLUMNS = {
    "severity_score": "FLOAT",
    "image_severity_score": "FLOAT",
    "ai_confidence_score": "FLOAT",
    "survey_score": "FLOAT",
    "weather_score": "FLOAT",
    "density_score": "FLOAT",
    "severity_breakdown": "TEXT",
    "image_analysis_summary": "TEXT",
    "area_affected_sqm": "FLOAT",
    "population_affected": "FLOAT",
    "duration_hours": "FLOAT",
    "survey_data": "TEXT",
}

HOTSPOT_OPTIONAL_COLUMNS = {
    "severity_score": "FLOAT",
    "radius_meters": "FLOAT",
    "complaint_ids": "TEXT",
    "dominant_category": "VARCHAR(100)",
    "trend": "VARCHAR(50)",
}


def sync_additive_schema(engine) -> None:
    """
    Additive local schema sync for projects that use metadata.create_all
    instead of migrations. This only adds missing nullable columns.
    """
    inspector = inspect(engine)
    table_names = inspector.get_table_names()
    if "complaints" not in table_names:
        return

    existing_columns = {column["name"] for column in inspector.get_columns("complaints")}
    missing_columns = {
        name: ddl_type
        for name, ddl_type in COMPLAINT_OPTIONAL_COLUMNS.items()
        if name not in existing_columns
    }
    if missing_columns:
        with engine.begin() as connection:
            for column_name, ddl_type in missing_columns.items():
                connection.execute(
                    text(f"ALTER TABLE complaints ADD COLUMN {column_name} {ddl_type}")
                )
                logger.info("Added missing complaints.%s column", column_name)

    if "hotspots" in table_names:
        existing_hotspot_columns = {
            column["name"] for column in inspector.get_columns("hotspots")
        }
        missing_hotspot_columns = {
            name: ddl_type
            for name, ddl_type in HOTSPOT_OPTIONAL_COLUMNS.items()
            if name not in existing_hotspot_columns
        }
        with engine.begin() as connection:
            for column_name, ddl_type in missing_hotspot_columns.items():
                connection.execute(
                    text(f"ALTER TABLE hotspots ADD COLUMN {column_name} {ddl_type}")
                )
                logger.info("Added missing hotspots.%s column", column_name)
