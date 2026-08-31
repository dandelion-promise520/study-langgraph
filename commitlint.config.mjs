export default {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "scope-enum": [
      2,
      "always",
      [
        "root",
        "backend",
        "frontend",
        "types",
        "agent",
        "ui",
        "motion",
        "config",
        "deps",
      ],
    ],
    "scope-empty": [0, "always"],
  },
};
