const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const configPath = path.join(root, 'capacitor.config.ts');
const source = fs.readFileSync(configPath, 'utf8');
const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));

assert.match(source, /appId:\s*['"]cn\.com\.schoolsystem\.app['"]/, 'Capacitor appId should match desktop and mobile');
assert.match(source, /appName:\s*['"]校衡台['"]/, 'Capacitor appName should use the product name');
assert.match(source, /webDir:\s*['"]dist['"]/, 'Capacitor should sync the production web build');
assert.match(source, /url:\s*['"]https:\/\/schoolsystem\.com\.cn['"]/, 'native shells should load the production HTTPS origin');
assert.match(source, /cleartext:\s*false/, 'native shells must reject cleartext traffic');
assert.ok(fs.existsSync(path.join(root, 'android/app/build.gradle')) || fs.existsSync(path.join(root, 'android/app/build.gradle.kts')), 'Android Gradle app project should exist');
assert.ok(fs.existsSync(path.join(root, 'android/gradlew.bat')), 'Gradle wrapper should be committed for Windows CI');
assert.ok(fs.existsSync(path.join(root, 'ios/App/App.xcodeproj/project.pbxproj')), 'iOS Xcode project should exist');
assert.ok(fs.existsSync(path.join(root, 'ios/App/App/Info.plist')), 'iOS application metadata should exist');
assert.equal(packageJson.scripts?.['mobile:sync'], 'npm run build && cap sync');
assert.equal(packageJson.scripts?.['android:build:test'], 'npm run mobile:sync && cd android && gradlew.bat assembleDebug');
assert.equal(packageJson.scripts?.['ios:sync'], 'npm run mobile:sync');

console.log('capacitor package contract tests passed');
