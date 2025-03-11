module.exports = {
  presets: [
    ['@babel/preset-env', { targets: { node: 'current' } }],
    '@babel/preset-typescript',
    ['@babel/preset-react', { runtime: 'automatic' }],
  ],
  plugins: [
    // These plugins help with compatibility for Next.js-specific features
    ['babel-plugin-transform-import-meta'],
    ['@babel/plugin-transform-react-jsx'],
  ],
};
