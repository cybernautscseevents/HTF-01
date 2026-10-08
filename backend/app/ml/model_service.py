import json
import os
import pandas as pd
import numpy as np
import xgboost as xgb
from pathlib import Path
from typing import Dict, List, Any, Tuple
from app.core.config import MODEL_PATH, FEATURE_COLUMNS_PATH, METADATA_PATH


class ModelService:
    def __init__(self):
        self.model: Optional[xgb.XGBClassifier] = None
        self.feature_columns: List[str] = []
        self.metadata: Dict[str, Any] = {}
        self.feature_importances: Dict[str, float] = {}
        self.is_loaded: bool = False
        self._load_model()

    def _load_model(self):
        """
        Loads the trained XGBoost model and feature schema.
        """
        if not os.path.exists(MODEL_PATH):
            raise FileNotFoundError(f"Trained XGBoost model not found at {MODEL_PATH}")
        if not os.path.exists(FEATURE_COLUMNS_PATH):
            raise FileNotFoundError(f"Feature columns schema not found at {FEATURE_COLUMNS_PATH}")

        # Load feature columns
        with open(FEATURE_COLUMNS_PATH, "r") as f:
            self.feature_columns = json.load(f)

        # Load metadata if present
        if os.path.exists(METADATA_PATH):
            with open(METADATA_PATH, "r") as f:
                self.metadata = json.load(f)

        # Load XGBClassifier
        self.model = xgb.XGBClassifier()
        self.model.load_model(str(MODEL_PATH))
        self.is_loaded = True

        # Compute global feature importances
        try:
            booster = self.model.get_booster()
            score_dict = booster.get_score(importance_type="gain")
            total_gain = sum(score_dict.values()) if score_dict else 1.0
            self.feature_importances = {
                k: round(v / total_gain, 4) for k, v in score_dict.items()
            }
        except Exception:
            self.feature_importances = {}

    def predict(self, features_df: pd.DataFrame) -> pd.DataFrame:
        """
        Runs batch inference on account features DataFrame.
        Returns DataFrame with account_id, mule_probability, ml_score, and prediction.
        """
        if not self.is_loaded or self.model is None:
            raise RuntimeError("Model is not initialized")

        # Select columns in exact order
        X = features_df[self.feature_columns].copy()
        X = X.fillna(0.0)

        probs = self.model.predict_proba(X)[:, 1]
        threshold = self.metadata.get("threshold", 0.5)

        results_df = pd.DataFrame({
            "account_id": features_df["account_id"],
            "mule_probability": probs,
            "ml_score": np.round(probs * 100.0, 1),
            "prediction": (probs >= threshold).astype(int)
        })

        return results_df

    def get_account_top_features(self, account_features_row: Dict[str, Any], top_k: int = 5) -> List[Dict[str, Any]]:
        """
        Identifies top contributing features for a given account based on
        feature value abnormality scaled by model importance.
        """
        contributions = []
        for feat in self.feature_columns:
            val = float(account_features_row.get(feat, 0.0))
            importance = self.feature_importances.get(feat, 0.01)

            # Heuristic impact score
            impact = abs(val) * importance
            contributions.append({
                "feature": feat,
                "value": round(val, 4),
                "model_importance": round(importance, 4),
                "impact": impact
            })

        contributions.sort(key=lambda x: x["impact"], reverse=True)
        return contributions[:top_k]
