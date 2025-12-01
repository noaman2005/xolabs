import nextPlugin from 'eslint-plugin-next'
import reactRefresh from 'eslint-plugin-react-refresh'

export default [
  {
    ignores: ['**/dist/**', '**/.next/**', '**/coverage/**', '**/.aws-sam/**'],
  },
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    plugins: {
      'react-refresh': reactRefresh,
    },
    rules: {
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },
  ...nextPlugin.configs['core-web-vitals'],
]
