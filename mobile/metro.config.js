const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Gerekirse "buffer" paketi için resolveRequest içerisinde shim ayarını yap:
// config.resolver.resolveRequest = (context, moduleName, platform) => { ... }

module.exports = withNativeWind(config, { input: './global.css' });
