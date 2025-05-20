#!/bin/bash
# Activate virtual environment and install requirements

# Activate virtual environment
source venv/bin/activate

# Install requirements if requested
if [ "$1" = "install" ]; then
    echo "Installing requirements..."
    pip install -r ../../requirements.txt
    echo "Requirements installed."
fi

echo "Virtual environment activated. Run 'deactivate' to exit." 