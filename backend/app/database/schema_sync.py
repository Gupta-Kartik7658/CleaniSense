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
}


def sync_additive_schema(engine) -> None:
    """
    Additive local schema sync for projects that use metadata.create_all
    instead of migrations. This only adds missing nullable columns.
    """
    inspector = inspect(engine)
    if "complaints" not in inspector.get_table_names():
        return

    existing_columns = {column["name"] for column in inspector.get_columns("complaints")}
    missing_columns = {
        name: ddl_type
        for name, ddl_type in COMPLAINT_OPTIONAL_COLUMNS.items()
        if name not in existing_columns
    }
    if not missing_columns:
        return

    with engine.begin() as connection:
        for column_name, ddl_type in missing_columns.items():
            connection.execute(
                text(f"ALTER TABLE complaints ADD COLUMN {column_name} {ddl_type}")
            )
            logger.info("Added missing complaints.%s column", column_name)
