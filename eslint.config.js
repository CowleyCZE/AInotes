import globals from "globals";
import tseslint from "typescript-eslint";
import pluginReact from "eslint-plugin-react";

export default [
  {
    ignores: ["dist/**"], // Přidáno pro ignorování složky dist
    languageOptions: { 
        globals: globals.browser,
        parserOptions: {
            ecmaFeatures: {
                jsx: true,
            },
            ecmaVersion: "latest",
            sourceType: "module",
        },
    },
    settings: {
        react: {
          version: 'detect', // Explicitně nastavená verze Reactu
        },
    },
    plugins: {
        react: pluginReact,
        "@typescript-eslint": tseslint.plugin,
    },
    rules: {
        "react/react-in-jsx-scope": "off",
        "react/prop-types": "off",
        "react/no-unescaped-entities": "off", // Vypnuto kvůli chybám v generovaném kódu
        "@typescript-eslint/no-explicit-any": "off",
        "@typescript-eslint/no-non-null-assertion": "off",
        "@typescript-eslint/no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }], // Změněno na varování a ignorování proměnných začínajících podtržítkem
    }
  },
  ...tseslint.configs.recommended,
  pluginReact.configs.flat.recommended,
];
