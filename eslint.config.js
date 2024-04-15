import globals from "globals";
import js from "@eslint/js";
import prettierConfig from "eslint-config-prettier";

export default [
  js.configs.recommended,
  prettierConfig,
  {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
      },
    },
  },
  {
    files: ["**/*.js"],
  },
  {
    ignores: ["**/*.json", "dist"],
  },
  {
    rules: {
      indent: [
        "warn",
        2,
        {
          SwitchCase: 1,
          FunctionDeclaration: {
            body: 1,
            parameters: 2,
          },
          FunctionExpression: {
            body: 1,
            parameters: 2,
          },
        },
      ],
      quotes: [
        "warn",
        "double",
        {
          avoidEscape: true,
          allowTemplateLiterals: true,
        },
      ],
      semi: ["warn", "always"],
      "no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "_",
        },
      ],
      "comma-dangle": ["warn", "always-multiline"],
    },
  },
];
