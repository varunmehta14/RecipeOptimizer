#!/bin/bash

# Helper script to run tests with or without API key

# Function to display help
show_help() {
  echo "Recipe Optimizer AI Testing Script"
  echo ""
  echo "Usage: ./run_tests.sh [OPTIONS]"
  echo ""
  echo "Options:"
  echo "  -m, --mocked     Run tests with mocks (no API key required)"
  echo "  -a, --api        Run tests with real API calls (requires API key)"
  echo "  -p, --parse      Run only the recipe parser test"
  echo "  -k KEY, --key=KEY  Set the Google API key for this session"
  echo "  -h, --help       Show this help message"
  echo ""
  echo "Examples:"
  echo "  ./run_tests.sh -m          # Run mocked tests"
  echo "  ./run_tests.sh -a -k \"ABCD\"  # Run tests with API key ABCD"
  echo "  ./run_tests.sh -p          # Run only the parse test"
  echo ""
}

# Default values
RUN_MOCKED=false
RUN_API=false
RUN_PARSE=false
API_KEY=""

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    -m|--mocked)
      RUN_MOCKED=true
      shift
      ;;
    -a|--api)
      RUN_API=true
      shift
      ;;
    -p|--parse)
      RUN_PARSE=true
      shift
      ;;
    -k|--key)
      API_KEY="$2"
      shift
      shift
      ;;
    -k=*|--key=*)
      API_KEY="${1#*=}"
      shift
      ;;
    -h|--help)
      show_help
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      show_help
      exit 1
      ;;
  esac
done

# If no specific test type is specified, run mocked tests
if [[ "$RUN_MOCKED" == "false" && "$RUN_API" == "false" && "$RUN_PARSE" == "false" ]]; then
  echo "No test type specified, running mocked tests by default"
  RUN_MOCKED=true
fi

# Check if API key is required but not provided
if [[ "$RUN_API" == "true" && -z "$API_KEY" ]]; then
  if [[ -f .env && $(grep -c "GOOGLE_API_KEY" .env) -gt 0 ]]; then
    echo "Using Google API key from .env file"
  else
    echo "Warning: API key is required for API tests but not provided"
    echo "Tests may fail if GOOGLE_API_KEY is not set in your environment or .env file"
    echo ""
  fi
fi

# Prepare base command
CMD="cd app/backend && ./venv/bin/pytest ../../tests/"

# Add specific test paths based on options
if [[ "$RUN_PARSE" == "true" ]]; then
  CMD="$CMD test_parse.py -v"
elif [[ "$RUN_MOCKED" == "true" ]]; then
  CMD="$CMD test_pipeline_mocked.py -v"
fi

# Add API key if provided
if [[ ! -z "$API_KEY" ]]; then
  CMD="GOOGLE_API_KEY=\"$API_KEY\" $CMD"
fi

# Run the command
echo "Running: $CMD"
eval $CMD 