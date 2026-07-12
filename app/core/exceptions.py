from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

class APIException(Exception):
    def __init__(self, status_code: int, detail: str, code: str):
        super().__init__(detail)
        self.status_code = status_code
        self.detail = detail
        self.code = code

def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(APIException)
    async def api_exception_handler(request: Request, exc: APIException):
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.detail, "code": exc.code}
        )
