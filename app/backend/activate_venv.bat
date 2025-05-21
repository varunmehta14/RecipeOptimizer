@echo off
:: Activate virtual environment and install requirements

:: Activate virtual environment
call venv\Scripts\activate.bat

:: Install requirements if requested
if "%1"=="install" (
    echo Installing requirements...
    pip install -r requirements.txt
    echo Requirements installed.
)

echo Virtual environment activated. Run 'deactivate' to exit. 