import pytest
import pandas as pd
import geopandas as gpd
import sys 
import numpy as np

@pytest.fixture(scope="session", autouse=True)
def print_versions():
    print("\n=== ENVIRONMENT INFO ===")
    print("pandas:", pd.__version__)
    print("geopandas:", gpd.__version__)
    print("Python:", sys.version)
    print("numpy:", np.__version__)
    print("========================\n")