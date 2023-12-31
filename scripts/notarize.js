/* eslint-disable @typescript-eslint/no-var-requires */

require('dotenv').config()
const { notarize } = require('@electron/notarize')

exports.default = async function notarizing(context) {
  const { electronPlatformName, appOutDir } = context
  if (electronPlatformName !== 'darwin') {
    return
  }

  const appName = context.packager.appInfo.productFilename

  if (process.env.CSC_IDENTITY_AUTO_DISCOVERY === 'false') {
    return
  }

  return await notarize({
    appBundleId: 'com.dynaboard.ai-studio',
    appPath: `${appOutDir}/${appName}.app`,
    appleApiKey: process.env.APPLE_API_KEY,
    appleApiKeyId: process.env.APPLE_API_KEY_ID,
    appleApiIssuer: process.env.APPLE_API_ISSUER,
  })
}
