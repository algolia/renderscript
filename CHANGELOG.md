## [2.1.9](https://github.com/algolia/renderscript/compare/v2.1.8...v2.1.9) (2022-03-31)


### Bug Fixes

* unnecessary dot ([b29de34](https://github.com/algolia/renderscript/commit/b29de34ac1e300600cd847ddee249eb87ad4935a))

## [2.1.8](https://github.com/algolia/renderscript/compare/v2.1.7...v2.1.8) (2022-03-31)


### Bug Fixes

* improve errors reporting ([#605](https://github.com/algolia/renderscript/issues/605)) ([72a51a3](https://github.com/algolia/renderscript/commit/72a51a36168542b4322a6a2fa0f13c1b7a9b2324))

## [2.1.7](https://github.com/algolia/renderscript/compare/v2.1.6...v2.1.7) (2022-03-29)


### Bug Fixes

* **release:** improve process and dockerfile again ([#604](https://github.com/algolia/renderscript/issues/604)) ([c75e356](https://github.com/algolia/renderscript/commit/c75e356c2965a76d30640b6c5bfaf445e445d568))

## [2.1.6](https://github.com/algolia/renderscript/compare/v2.1.5...v2.1.6) (2022-03-28)


### Bug Fixes

* **ci:** use custom email and author name for release ([d4f2b56](https://github.com/algolia/renderscript/commit/d4f2b5658c6b40706f9be3f15c80dd8b785b40ba))

## [2.1.5](https://github.com/algolia/renderscript/compare/v2.1.4...v2.1.5) (2022-03-28)


### Bug Fixes

* **actions:** build docker only on release ([#603](https://github.com/algolia/renderscript/issues/603)) ([24ba4a1](https://github.com/algolia/renderscript/commit/24ba4a13cce7f5fd876291ea0984eecf42a86656))
* **ci:** env is not automatically populated ([1cd78c0](https://github.com/algolia/renderscript/commit/1cd78c081b22f3e358465c53f7736d107d181498))
* **ci:** use GH_TOKEN defined in secret ([083f334](https://github.com/algolia/renderscript/commit/083f3348a2b6acd9f8c84ce6c1f1b7322e111287))
* **ci:** use github actions ([#593](https://github.com/algolia/renderscript/issues/593)) ([fac77b0](https://github.com/algolia/renderscript/commit/fac77b0d28e02cb0be1442e8114a3ce8934a2ff8))
* use default github.token ([09accb7](https://github.com/algolia/renderscript/commit/09accb7511fbc3634f7a6ea08f3bca1169a607aa))

## [2.1.4](https://github.com/algolia/renderscript/compare/v2.1.3...v2.1.4) (2022-03-27)


### Bug Fixes

* **deps:** update dependency pino to v7.9.2 ([#582](https://github.com/algolia/renderscript/issues/582)) ([7f638e7](https://github.com/algolia/renderscript/commit/7f638e77a9777d943e6e5aacd235f08424717d56))
* **deps:** update dependency undici to v4.16.0 ([#581](https://github.com/algolia/renderscript/issues/581)) ([76ff27b](https://github.com/algolia/renderscript/commit/76ff27b790542d329f48d8b1b3e578c7ec7e5ee5))

## [2.1.3](https://github.com/algolia/renderscript/compare/v2.1.2...v2.1.3) (2022-03-27)


### Bug Fixes

* **deps:** update dependency playwright-chromium to v1.20.1 ([#597](https://github.com/algolia/renderscript/issues/597)) ([14ec124](https://github.com/algolia/renderscript/commit/14ec1246ed8f8f141f76191a27b1a66bd0497cab))

## [2.1.2](https://github.com/algolia/renderscript/compare/v2.1.1...v2.1.2) (2022-03-25)


### Bug Fixes

* chown using pwuser ([1e4f579](https://github.com/algolia/renderscript/commit/1e4f57944941c634d141cd4900d51b08ce23b628))

## [2.1.1](https://github.com/algolia/renderscript/compare/v2.1.0...v2.1.1) (2022-03-25)


### Bug Fixes

* **docker:** improve dockerfile size ([#592](https://github.com/algolia/renderscript/issues/592)) ([db395fd](https://github.com/algolia/renderscript/commit/db395fd7f6be80cb308942f6ab980da235516b67))

# [2.1.0](https://github.com/algolia/renderscript/compare/v2.0.1...v2.1.0) (2022-03-21)


### Bug Fixes

* **deps:** update dependency @sentry/node to v6.18.2 ([#580](https://github.com/algolia/renderscript/issues/580)) ([0c96215](https://github.com/algolia/renderscript/commit/0c96215344e5cbc16f525fccebc4a2cf6eab420b))


### Features

* clean error reporting ([#585](https://github.com/algolia/renderscript/issues/585)) ([c343028](https://github.com/algolia/renderscript/commit/c3430283cd0db7227dde59494ad18bac8311fd99))

## [2.0.1](https://github.com/algolia/renderscript/compare/v2.0.0...v2.0.1) (2022-03-19)


### Bug Fixes

* **deps:** update dependency playwright-chromium to v1.20.0 ([#587](https://github.com/algolia/renderscript/issues/587)) ([e7bd156](https://github.com/algolia/renderscript/commit/e7bd1568cbac027bc77cce500228a163011d5489))

# [2.0.0](https://github.com/algolia/renderscript/compare/v1.14.0...v2.0.0) (2022-03-16)


### Features

* v2 ([1294a61](https://github.com/algolia/renderscript/commit/1294a61180949cb4b4d031caddc54b104bc86db2))


### BREAKING CHANGES

* Replace Puppeteer by [Playwright](https://playwright.dev/).
* API responses has changed, please read [README.md](https://github.com/algolia/renderscript/README.md).
* Logging now output JSON.
* iframe are now blocked by default.
* `body` output now contains Doctype.
* `waitTime` now defines Budget per process not per request.
* Switch to Ubuntu image.

# [1.14.0](https://github.com/algolia/renderscript/compare/v1.13.2...v1.14.0) (2022-03-16)


### Features

* major upgrade ([e91c3b3](https://github.com/algolia/renderscript/commit/e91c3b390325fedce83fb485bc19d9e9bd45805e))
* major upgrade ([e554705](https://github.com/algolia/renderscript/commit/e55470544d9ae553dc41e506b1789670d1984509))

## [1.13.2](https://github.com/algolia/renderscript/compare/v1.13.1...v1.13.2) (2022-03-16)


### Bug Fixes

* **test:** adapt test image to new log ([#584](https://github.com/algolia/renderscript/issues/584)) ([91d6160](https://github.com/algolia/renderscript/commit/91d6160af2ff0347f282718607130942bf01eb05))

## [1.13.1](https://github.com/algolia/renderscript/compare/v1.13.0...v1.13.1) (2022-03-16)


### Bug Fixes

* **deps:** pin dependency pino to v ([#583](https://github.com/algolia/renderscript/issues/583)) ([89b2d9d](https://github.com/algolia/renderscript/commit/89b2d9db6a060fe3c84fd5b8e060b8cc69b52ae6))

# [1.13.0](https://github.com/algolia/renderscript/compare/v1.12.12...v1.13.0) (2022-03-15)


### Bug Fixes

* **deps:** update dependency @sentry/node to v6.18.1 ([#573](https://github.com/algolia/renderscript/issues/573)) ([1fd8b7c](https://github.com/algolia/renderscript/commit/1fd8b7c129451dd6491b4247c8815afa9dd222b4))
* simple solution for redirection ([#579](https://github.com/algolia/renderscript/issues/579)) ([6b99b8d](https://github.com/algolia/renderscript/commit/6b99b8d90fe15354cab6b700fa0da6fe704e35e9))


### Features

* use playwright ([#572](https://github.com/algolia/renderscript/issues/572)) ([89022e0](https://github.com/algolia/renderscript/commit/89022e0d9881ea83589263e32304b918add0307d))

## [1.12.12](https://github.com/algolia/renderscript/compare/v1.12.11...v1.12.12) (2022-02-27)


### Bug Fixes

* **deps:** update dependency @sentry/node to v6.18.0 ([#570](https://github.com/algolia/renderscript/issues/570)) ([e65c1da](https://github.com/algolia/renderscript/commit/e65c1da0edac48a3572b551b511338bcfaae8ca7))

## [1.12.11](https://github.com/algolia/renderscript/compare/v1.12.10...v1.12.11) (2022-02-25)


### Bug Fixes

* add debug ([a62f1ca](https://github.com/algolia/renderscript/commit/a62f1ca4a9439ba60d0210dcfa784ba1f37f7eb9))

## [1.12.10](https://github.com/algolia/renderscript/compare/v1.12.9...v1.12.10) (2022-02-25)


### Bug Fixes

* handle puppeteer hanging ([#562](https://github.com/algolia/renderscript/issues/562)) ([4b0c728](https://github.com/algolia/renderscript/commit/4b0c7282b07005224b9ae6fd5430cb35a5595173))

## [1.12.9](https://github.com/algolia/renderscript/compare/v1.12.8...v1.12.9) (2022-02-24)


### Bug Fixes

* rollback to puppeteer v12 ([#564](https://github.com/algolia/renderscript/issues/564)) ([2e2d4e6](https://github.com/algolia/renderscript/commit/2e2d4e676308ae0c39bafdfa60ea7e17667ac4e8))

## [1.12.8](https://github.com/algolia/renderscript/compare/v1.12.7...v1.12.8) (2022-02-24)


### Bug Fixes

* rollback to puppeteer 11 ([#563](https://github.com/algolia/renderscript/issues/563)) ([d223920](https://github.com/algolia/renderscript/commit/d22392027289678f657848a899f25cf1e6939f0a))

## [1.12.7](https://github.com/algolia/renderscript/compare/v1.12.6...v1.12.7) (2022-02-24)


### Bug Fixes

* orEqual ([dc973d8](https://github.com/algolia/renderscript/commit/dc973d8c5087477ace41b32fec7ebd1ca0e98e69))
* test max wait ([#561](https://github.com/algolia/renderscript/issues/561)) ([4e94a32](https://github.com/algolia/renderscript/commit/4e94a32e200163c98db63212035863a60b194417))

## [1.12.6](https://github.com/algolia/renderscript/compare/v1.12.5...v1.12.6) (2022-02-24)


### Bug Fixes

* metrics can fail ([#560](https://github.com/algolia/renderscript/issues/560)) ([4b4f5c0](https://github.com/algolia/renderscript/commit/4b4f5c0e98cf56973b3ad8dabf03b3757fb05d54))

## [1.12.5](https://github.com/algolia/renderscript/compare/v1.12.4...v1.12.5) (2022-02-24)


### Bug Fixes

* **tasks:** try to improve tracking and error reporting ([#559](https://github.com/algolia/renderscript/issues/559)) ([e4c132c](https://github.com/algolia/renderscript/commit/e4c132ca3fbf06069a48b56f7fb1dd42d8518d46))

## [1.12.4](https://github.com/algolia/renderscript/compare/v1.12.3...v1.12.4) (2022-02-23)


### Bug Fixes

* catch uncaugh exception ([00bf8d7](https://github.com/algolia/renderscript/commit/00bf8d737968564aa3e36c22bd4da0307a6eaf14))
* **docker:** do not use npm to run command ([8781163](https://github.com/algolia/renderscript/commit/878116360f7c642eddb4b936f17be19f8188a654))
* **exit:** await stats close ([25ac22e](https://github.com/algolia/renderscript/commit/25ac22e6ff5f1a7264c09b40d8266256e936e34d))

## [1.12.3](https://github.com/algolia/renderscript/compare/v1.12.2...v1.12.3) (2022-02-23)


### Bug Fixes

* **log:** be more verbose when exiting ([5bfa73d](https://github.com/algolia/renderscript/commit/5bfa73dc8d6050370656b307e2faec1872369a7d))

## [1.12.2](https://github.com/algolia/renderscript/compare/v1.12.1...v1.12.2) (2022-02-23)


### Bug Fixes

* **reporting:** alternative for environment name ([7f3771c](https://github.com/algolia/renderscript/commit/7f3771c329228888412b0c24fb568ad6d1b92d2b))

## [1.12.1](https://github.com/algolia/renderscript/compare/v1.12.0...v1.12.1) (2022-02-23)


### Bug Fixes

* **docker:** use cache ([#558](https://github.com/algolia/renderscript/issues/558)) ([56698a0](https://github.com/algolia/renderscript/commit/56698a0a95e390e5f537699b9080a9ca8b7742de))

# [1.12.0](https://github.com/algolia/renderscript/compare/v1.11.34...v1.12.0) (2022-02-23)


### Features

* error reporting ([#556](https://github.com/algolia/renderscript/issues/556)) ([3b70ac3](https://github.com/algolia/renderscript/commit/3b70ac3f1aba8bfd2d4ca81bcdc083eb92559b2b))

## [1.11.34](https://github.com/algolia/renderscript/compare/v1.11.33...v1.11.34) (2022-02-23)


### Bug Fixes

* upgrade to yarn 3 ([#557](https://github.com/algolia/renderscript/issues/557)) ([38088e5](https://github.com/algolia/renderscript/commit/38088e58e8080b7f7fe1aacb2d5d8d0d8f16807c))

## [1.11.33](https://github.com/algolia/renderscript/compare/v1.11.32...v1.11.33) (2022-02-20)


### Bug Fixes

* **deps:** update dependency express to v4.17.3 ([#554](https://github.com/algolia/renderscript/issues/554)) ([f3b2001](https://github.com/algolia/renderscript/commit/f3b2001b8f42bc12a92f37f83ab85ec6bc98276d))

## [1.11.32](https://github.com/algolia/renderscript/compare/v1.11.31...v1.11.32) (2022-02-19)


### Bug Fixes

* **deps:** update dependency body-parser to v1.19.2 ([#553](https://github.com/algolia/renderscript/issues/553)) ([0ba2690](https://github.com/algolia/renderscript/commit/0ba26902483dd1d01f05d399c4421ab657b32f32))

## [1.11.31](https://github.com/algolia/renderscript/compare/v1.11.30...v1.11.31) (2022-02-18)


### Bug Fixes

* **deps:** update dependency undici to v4.14.1 ([#552](https://github.com/algolia/renderscript/issues/552)) ([c25dce6](https://github.com/algolia/renderscript/commit/c25dce6f102e88ada91fe2fa6beb6147783e4cc5))

## [1.11.30](https://github.com/algolia/renderscript/compare/v1.11.29...v1.11.30) (2022-02-18)


### Bug Fixes

* **deps:** update dependency puppeteer-core to v13.3.2 ([#549](https://github.com/algolia/renderscript/issues/549)) ([b244949](https://github.com/algolia/renderscript/commit/b244949f002086abe671575f42de4c65f534e62d))

## [1.11.29](https://github.com/algolia/renderscript/compare/v1.11.28...v1.11.29) (2022-02-17)


### Bug Fixes

* release taggign ([87dd5d1](https://github.com/algolia/renderscript/commit/87dd5d18eebf92bc9be260b8ea232b20d47bf83a))

## [1.11.28](https://github.com/algolia/renderscript/compare/v1.11.27...v1.11.28) (2022-02-17)


### Bug Fixes

* **docker:** test image in CI ([#547](https://github.com/algolia/renderscript/issues/547)) ([53d1d34](https://github.com/algolia/renderscript/commit/53d1d34f796a45517820f5e66b80f77043305ea6))
* release condition ([7cd67d1](https://github.com/algolia/renderscript/commit/7cd67d156875e4a1b32fbd8e5c4f4a8c78b44d9c))
* remove --max-old-space-size to allow prod to modify this value ([80f1aee](https://github.com/algolia/renderscript/commit/80f1aeeaf19031d4e9eb954df1a3b9a763bb9fb3))

## [1.11.27](https://github.com/algolia/renderscript/compare/v1.11.26...v1.11.27) (2022-02-17)


### Bug Fixes

* **deps:** update dependency puppeteer-core to v13.3.1 ([#546](https://github.com/algolia/renderscript/issues/546)) ([743ce27](https://github.com/algolia/renderscript/commit/743ce2760b0c7b9dd9a438fd6b382db48455fc81))
* increase test margin ([c205c9b](https://github.com/algolia/renderscript/commit/c205c9b4c3f0200998220363b5ee28d1424c8192))
* ttf-freefont unavailable ([cf3e068](https://github.com/algolia/renderscript/commit/cf3e068be0d14668f286fff50fedba9918e5bdc3))

## [1.11.26](https://github.com/algolia/renderscript/compare/v1.11.25...v1.11.26) (2022-02-04)


### Bug Fixes

* **deps:** update dependency undici to v4.13.0 ([#538](https://github.com/algolia/renderscript/issues/538)) ([25b1ac0](https://github.com/algolia/renderscript/commit/25b1ac04f71ecc291a93f38f6e2e99cdbeb61ae3))

## [1.11.25](https://github.com/algolia/renderscript/compare/v1.11.24...v1.11.25) (2022-02-04)


### Bug Fixes

* **deps:** update dependency puppeteer-core to v13.1.3 ([#536](https://github.com/algolia/renderscript/issues/536)) ([21d08c0](https://github.com/algolia/renderscript/commit/21d08c07ff2354643fc3ab8e1b90256569ce4a79))

## [1.11.24](https://github.com/algolia/renderscript/compare/v1.11.23...v1.11.24) (2022-01-29)


### Bug Fixes

* **deps:** update dependency puppeteer-core to v13.1.2 ([#529](https://github.com/algolia/renderscript/issues/529)) ([2cf3994](https://github.com/algolia/renderscript/commit/2cf3994fe25ab2b6fd891c9fbc6278e3b26e00fa))

## [1.11.23](https://github.com/algolia/renderscript/compare/v1.11.22...v1.11.23) (2022-01-29)


### Bug Fixes

* **deps:** update dependency @algolia/dns-filter to v1.1.25 ([#528](https://github.com/algolia/renderscript/issues/528)) ([9e94096](https://github.com/algolia/renderscript/commit/9e94096c2d3ef17b12c24ba8d2802f71331abe59))

## [1.11.22](https://github.com/algolia/renderscript/compare/v1.11.21...v1.11.22) (2022-01-25)


### Bug Fixes

* **deps:** update dependency undici to v4.12.2 ([#382](https://github.com/algolia/renderscript/issues/382)) ([2a8c00a](https://github.com/algolia/renderscript/commit/2a8c00a05499c60160bbd035e00764466ae50189))

## [1.11.21](https://github.com/algolia/renderscript/compare/v1.11.20...v1.11.21) (2022-01-22)


### Bug Fixes

* **deps:** update dependency puppeteer-core to v13.1.1 ([#520](https://github.com/algolia/renderscript/issues/520)) ([d492fa2](https://github.com/algolia/renderscript/commit/d492fa2d8611ed25e5eb839862b6727380a13083))

## [1.11.20](https://github.com/algolia/renderscript/compare/v1.11.19...v1.11.20) (2022-01-21)


### Bug Fixes

* **deps:** update dependency altheia-async-data-validator to v5.0.13 ([#515](https://github.com/algolia/renderscript/issues/515)) ([f63e4e3](https://github.com/algolia/renderscript/commit/f63e4e384ed298660da608bde7af3119d91fe851))

## [1.11.19](https://github.com/algolia/renderscript/compare/v1.11.18...v1.11.19) (2022-01-03)


### Bug Fixes

* **deps:** update dependency puppeteer-core to v13 ([#495](https://github.com/algolia/renderscript/issues/495)) ([2247a8a](https://github.com/algolia/renderscript/commit/2247a8a86a3a3cb097034036c8e48ae2bfc4de31))

## [1.11.18](https://github.com/algolia/renderscript/compare/v1.11.17...v1.11.18) (2021-12-24)


### Bug Fixes

* **deps:** update dependency express to v4.17.2 ([#498](https://github.com/algolia/renderscript/issues/498)) ([f977d45](https://github.com/algolia/renderscript/commit/f977d456c859525097e2100147669d2bdb2b51a0))

## [1.11.17](https://github.com/algolia/renderscript/compare/v1.11.16...v1.11.17) (2021-12-18)


### Bug Fixes

* **deps:** update dependency body-parser to v1.19.1 ([#493](https://github.com/algolia/renderscript/issues/493)) ([9c34680](https://github.com/algolia/renderscript/commit/9c34680da0af71f6716230a5795d04664d547d8e))

## [1.11.16](https://github.com/algolia/renderscript/compare/v1.11.15...v1.11.16) (2021-11-19)


### Bug Fixes

* **deps:** update dependency cookie-parser to v1.4.6 ([#470](https://github.com/algolia/renderscript/issues/470)) ([3c341e6](https://github.com/algolia/renderscript/commit/3c341e60002791b8cbddbf46bcb71af401585fa8))

## [1.11.15](https://github.com/algolia/renderscript/compare/v1.11.14...v1.11.15) (2021-11-12)


### Bug Fixes

* **deps:** update dependency puppeteer-core to v11 ([#464](https://github.com/algolia/renderscript/issues/464)) ([55263f6](https://github.com/algolia/renderscript/commit/55263f6e5d408bf3c5d83140537a86d6b55a382e))

## [1.11.14](https://github.com/algolia/renderscript/compare/v1.11.13...v1.11.14) (2021-11-09)


### Bug Fixes

* **deps:** update dependency hot-shots to v9 ([#462](https://github.com/algolia/renderscript/issues/462)) ([d3c2743](https://github.com/algolia/renderscript/commit/d3c2743d272afa8a0216a5cb519d28508c8ab741))

## [1.11.13](https://github.com/algolia/renderscript/compare/v1.11.12...v1.11.13) (2021-11-06)


### Bug Fixes

* **deps:** update dependency @algolia/dns-filter to v1.1.24 ([#463](https://github.com/algolia/renderscript/issues/463)) ([94107db](https://github.com/algolia/renderscript/commit/94107dbd50c64410aeee18b7609ae8c9f7277056))

## [1.11.12](https://github.com/algolia/renderscript/compare/v1.11.11...v1.11.12) (2021-11-02)


### Bug Fixes

* lint + wait for api ([391c23f](https://github.com/algolia/renderscript/commit/391c23f03ae9ae1581e02dbca2826ab2909dea6b))

## [1.11.11](https://github.com/algolia/renderscript/compare/v1.11.10...v1.11.11) (2021-10-15)


### Bug Fixes

* **deps:** update dependency @algolia/dns-filter to v1.1.23 ([#443](https://github.com/algolia/renderscript/issues/443)) ([751df75](https://github.com/algolia/renderscript/commit/751df75924807c6392be7517bbef89ce2d5319f0))

## [1.11.10](https://github.com/algolia/renderscript/compare/v1.11.9...v1.11.10) (2021-10-01)


### Bug Fixes

* **deps:** update dependency hot-shots to v8.5.2 ([#434](https://github.com/algolia/renderscript/issues/434)) ([65bae0c](https://github.com/algolia/renderscript/commit/65bae0c8830d22f6b84c49e838438b1dc1dcc579))

## [1.11.9](https://github.com/algolia/renderscript/compare/v1.11.8...v1.11.9) (2021-09-25)


### Bug Fixes

* **deps:** update dependency puppeteer-core to v10.4.0 ([#429](https://github.com/algolia/renderscript/issues/429)) ([295847b](https://github.com/algolia/renderscript/commit/295847be5744d5978e9619c9b74037670f69cf83))

## [1.11.8](https://github.com/algolia/renderscript/compare/v1.11.7...v1.11.8) (2021-09-14)


### Bug Fixes

* redirects optimizations ([#411](https://github.com/algolia/renderscript/issues/411)) ([46016b7](https://github.com/algolia/renderscript/commit/46016b7940dfee1b4fd769888547e5ea89a88cbb))

## [1.11.7](https://github.com/algolia/renderscript/compare/v1.11.6...v1.11.7) (2021-09-04)


### Bug Fixes

* **deps:** update dependency hot-shots to v8.5.1 ([#406](https://github.com/algolia/renderscript/issues/406)) ([0a3b220](https://github.com/algolia/renderscript/commit/0a3b22032a02a52c1f3050720b2fc9d9885d617d))

## [1.11.6](https://github.com/algolia/renderscript/compare/v1.11.5...v1.11.6) (2021-09-03)


### Bug Fixes

* **deps:** update dependency altheia-async-data-validator to v5.0.12 ([#405](https://github.com/algolia/renderscript/issues/405)) ([d0778e7](https://github.com/algolia/renderscript/commit/d0778e707298fa2093f12f4f292bbfc1d7d9025e))

## [1.11.5](https://github.com/algolia/renderscript/compare/v1.11.4...v1.11.5) (2021-08-31)


### Bug Fixes

* **login:** wait more and dont renderHTML if not needed ([#394](https://github.com/algolia/renderscript/issues/394)) ([1a4c649](https://github.com/algolia/renderscript/commit/1a4c6491f56793e9f75464694fec39f8dca01c2a))

## [1.11.4](https://github.com/algolia/renderscript/compare/v1.11.3...v1.11.4) (2021-08-27)


### Bug Fixes

* **datadog:** add hostname to checks ([70bcc39](https://github.com/algolia/renderscript/commit/70bcc39fadb4f34ec07be7ee886e1e923becd0d3))

## [1.11.3](https://github.com/algolia/renderscript/compare/v1.11.2...v1.11.3) (2021-08-17)


### Bug Fixes

* **login:** ignore aria-hidden password fields ([#386](https://github.com/algolia/renderscript/issues/386)) ([f771c41](https://github.com/algolia/renderscript/commit/f771c419b6c326c4c8e118826c1a55ba5c65573d))

## [1.11.2](https://github.com/algolia/renderscript/compare/v1.11.1...v1.11.2) (2021-08-16)


### Bug Fixes

* **deps:** update dependency @algolia/dns-filter to v1.1.22 ([#385](https://github.com/algolia/renderscript/issues/385)) ([58d7fd5](https://github.com/algolia/renderscript/commit/58d7fd59fbbae683b5715d62dad3a3dbd7f9575e))

## [1.11.1](https://github.com/algolia/renderscript/compare/v1.11.0...v1.11.1) (2021-08-07)


### Bug Fixes

* **deps:** update dependency puppeteer-core to v10.2.0 ([#375](https://github.com/algolia/renderscript/issues/375)) ([9e4c686](https://github.com/algolia/renderscript/commit/9e4c686d6e22609900d3ff1f2a634a815b757c3a))

# [1.11.0](https://github.com/algolia/renderscript/compare/v1.10.6...v1.11.0) (2021-08-02)


### Features

* simple adblocking ([#369](https://github.com/algolia/renderscript/issues/369)) ([cf9b607](https://github.com/algolia/renderscript/commit/cf9b607b9dbbaaa50db3a089965f5511ca421655))

## [1.10.6](https://github.com/algolia/renderscript/compare/v1.10.5...v1.10.6) (2021-07-27)


### Bug Fixes

* order of health check + datadog report ([a124409](https://github.com/algolia/renderscript/commit/a124409768ecf1d0b2308e7783b9dcb6ec727cb6))

## [1.10.5](https://github.com/algolia/renderscript/compare/v1.10.4...v1.10.5) (2021-07-27)


### Bug Fixes

* ignore more errors ([dd5775a](https://github.com/algolia/renderscript/commit/dd5775ac65f535569d5ec714906d9a2b35f54e67))

## [1.10.4](https://github.com/algolia/renderscript/compare/v1.10.3...v1.10.4) (2021-07-25)


### Bug Fixes

* handle empty response ([40cf060](https://github.com/algolia/renderscript/commit/40cf060c95a200eb57554e9eaee91d714978f4ba))

## [1.10.3](https://github.com/algolia/renderscript/compare/v1.10.2...v1.10.3) (2021-07-25)


### Bug Fixes

* health check for long task + log fail job + log id of the jobs ([e81663a](https://github.com/algolia/renderscript/commit/e81663a0c35ab2c069b64958a5d5b4013a13a078))

## [1.10.2](https://github.com/algolia/renderscript/compare/v1.10.1...v1.10.2) (2021-07-25)


### Bug Fixes

* do not report expected ENOTFOUND ([f448903](https://github.com/algolia/renderscript/commit/f448903817c7e78adc57a580955da17b6e96dde3))

## [1.10.1](https://github.com/algolia/renderscript/compare/v1.10.0...v1.10.1) (2021-07-25)


### Bug Fixes

* handle 200 without body ([4a4e1b0](https://github.com/algolia/renderscript/commit/4a4e1b09b5fd392347967c687cd2cdef665e6b89))

# [1.10.0](https://github.com/algolia/renderscript/compare/v1.9.3...v1.10.0) (2021-07-24)


### Features

* add GET /list  ([#359](https://github.com/algolia/renderscript/issues/359)) ([bd5e612](https://github.com/algolia/renderscript/commit/bd5e612fcc13dd25fb223e489dd72a3d97ebf0c1))

## [1.9.3](https://github.com/algolia/renderscript/compare/v1.9.2...v1.9.3) (2021-07-24)


### Bug Fixes

* **deps:** update dependency @algolia/dns-filter to v1.1.19 ([#356](https://github.com/algolia/renderscript/issues/356)) ([5d57c7b](https://github.com/algolia/renderscript/commit/5d57c7be8f6a323ef0a7f36769fcb283add71544))

## [1.9.2](https://github.com/algolia/renderscript/compare/v1.9.1...v1.9.2) (2021-07-23)


### Bug Fixes

* redirection does not have a body ([#353](https://github.com/algolia/renderscript/issues/353)) ([e5ff565](https://github.com/algolia/renderscript/commit/e5ff56521f4c3669495f74ca231eaff8e805d345))

## [1.9.1](https://github.com/algolia/renderscript/compare/v1.9.0...v1.9.1) (2021-07-23)


### Bug Fixes

* report more metrics + make sure we close everything ([#352](https://github.com/algolia/renderscript/issues/352)) ([c976192](https://github.com/algolia/renderscript/commit/c976192061cce5b6cc291cceb2676affe7ade048))

# [1.9.0](https://github.com/algolia/renderscript/compare/v1.8.0...v1.9.0) (2021-07-23)


### Features

* expose more metrics ([#351](https://github.com/algolia/renderscript/issues/351)) ([b181e70](https://github.com/algolia/renderscript/commit/b181e7051acec3a7e2fb595cce507daa68bc2449))

# [1.8.0](https://github.com/algolia/renderscript/compare/v1.7.17...v1.8.0) (2021-07-22)


### Features

* major refacto ([#348](https://github.com/algolia/renderscript/issues/348)) ([c9013b0](https://github.com/algolia/renderscript/commit/c9013b046e6a40ddebe314c0bf140b96f3abccae))

## [1.7.17](https://github.com/algolia/renderscript/compare/v1.7.16...v1.7.17) (2021-07-22)


### Bug Fixes

* remove env sourcing ([39b6478](https://github.com/algolia/renderscript/commit/39b6478d12eeba91ac88cb18bee58506ec2fae39))

## [1.7.16](https://github.com/algolia/renderscript/compare/v1.7.15...v1.7.16) (2021-07-22)


### Bug Fixes

* automatic release ([c55230f](https://github.com/algolia/renderscript/commit/c55230f8f5dcd54560ca3050abd9d5cac061f8a1))

## [1.7.15](https://github.com/algolia/renderscript/compare/v1.7.14...v1.7.15) (2021-07-22)


### Bug Fixes

* **api:** add validation ([#350](https://github.com/algolia/renderscript/issues/350)) ([a18990f](https://github.com/algolia/renderscript/commit/a18990f864215e71c1bef952acdb7e6af9674d0c))

## [1.7.14](https://github.com/algolia/renderscript/compare/v1.7.13...v1.7.14) (2021-07-20)


### Bug Fixes

* coding style ([#347](https://github.com/algolia/renderscript/issues/347)) ([ed8893c](https://github.com/algolia/renderscript/commit/ed8893c941183ba8ad45af67986996c333429947))

## [1.7.13](https://github.com/algolia/renderscript/compare/v1.7.12...v1.7.13) (2021-07-17)


### Bug Fixes

* **deps:** update dependency hot-shots to v8.5.0 ([#342](https://github.com/algolia/renderscript/issues/342)) ([7b008a0](https://github.com/algolia/renderscript/commit/7b008a0cb25e85ba2da27a62f0c103562562b938))

## [1.7.12](https://github.com/algolia/renderscript/compare/v1.7.11...v1.7.12) (2021-07-15)


### Bug Fixes

* bump version ([0c7e81b](https://github.com/algolia/renderscript/commit/0c7e81bf844ab45997da01f2845c2f49362a6da9))

## [1.7.11](https://github.com/algolia/renderscript/compare/v1.7.10...v1.7.11) (2021-07-15)


### Bug Fixes

* waitForNavigation can resolve with null ([#338](https://github.com/algolia/renderscript/issues/338)) ([f05f878](https://github.com/algolia/renderscript/commit/f05f87838cf45d24d6e3aa3694d04c29d401b739))

## [1.7.10](https://github.com/algolia/renderscript/compare/v1.7.9...v1.7.10) (2021-07-07)


### Bug Fixes

* bump version ([36efdc9](https://github.com/algolia/renderscript/commit/36efdc90da2c0ffdb1a77c2945ed4baf67415251))

## [1.7.9](https://github.com/algolia/renderscript/compare/v1.7.8...v1.7.9) (2021-07-03)


### Bug Fixes

* **deps:** update dependency hot-shots to v8.4.0 ([#327](https://github.com/algolia/renderscript/issues/327)) ([e104830](https://github.com/algolia/renderscript/commit/e1048303a7dbb52c6606e67c0ef5af0cf8c116fd))

## [1.7.8](https://github.com/algolia/renderscript/compare/v1.7.7...v1.7.8) (2021-07-03)


### Bug Fixes

* **deps:** update dependency puppeteer-core to v10.1.0 ([#326](https://github.com/algolia/renderscript/issues/326)) ([98753e9](https://github.com/algolia/renderscript/commit/98753e9e868f3f54adca8c85f1bc14488ce2583e))

## [1.7.7](https://github.com/algolia/renderscript/compare/v1.7.6...v1.7.7) (2021-06-23)


### Bug Fixes

* move 2-steps logging logs to the right place ([#312](https://github.com/algolia/renderscript/issues/312)) ([b8f2820](https://github.com/algolia/renderscript/commit/b8f2820bdfa4e647d2252c72c9687a9cca3b1037))

## [1.7.6](https://github.com/algolia/renderscript/compare/v1.7.5...v1.7.6) (2021-06-22)


### Bug Fixes

* add Contributing ([b4a026b](https://github.com/algolia/renderscript/commit/b4a026b6bef81c01d92494693273b709edbeba04))

## [1.7.5](https://github.com/algolia/renderscript/compare/v1.7.4...v1.7.5) (2021-06-22)


### Bug Fixes

* bump version ([02e2b13](https://github.com/algolia/renderscript/commit/02e2b136dcac6d7c567aa21b94aa6fce3a2cc947))

## [1.7.4](https://github.com/algolia/renderscript/compare/v1.7.3...v1.7.4) (2021-06-14)


### Bug Fixes

* **deps:** update dependency puppeteer-core to v10 ([#301](https://github.com/algolia/renderscript/issues/301)) ([76909db](https://github.com/algolia/renderscript/commit/76909db0e089a0d414a81e0bcf8d7e279865021c))

## [1.7.3](https://github.com/algolia/renderscript/compare/v1.7.2...v1.7.3) (2021-06-12)


### Bug Fixes

* **deps:** update dependency hot-shots to v8.3.2 ([#297](https://github.com/algolia/renderscript/issues/297)) ([2018f69](https://github.com/algolia/renderscript/commit/2018f69e3f0bd2849ade48324bbbb4eeaf894c2f))

## [1.7.2](https://github.com/algolia/renderscript/compare/v1.7.1...v1.7.2) (2021-05-29)


### Bug Fixes

* **deps:** update dependency @algolia/dns-filter to v1.1.17 ([#287](https://github.com/algolia/renderscript/issues/287)) ([d509bff](https://github.com/algolia/renderscript/commit/d509bff583e9820ed74eba189aab6de7fcf88c36))

## [1.7.1](https://github.com/algolia/renderscript/compare/v1.7.0...v1.7.1) (2021-05-08)


### Bug Fixes

* **deps:** update dependency puppeteer-core to v9.1.1 ([#267](https://github.com/algolia/renderscript/issues/267)) ([28fed5a](https://github.com/algolia/renderscript/commit/28fed5ac89b8c9a589447c7c5bd3c7aab665ba25))

# [1.7.0](https://github.com/algolia/renderscript/compare/v1.6.1...v1.7.0) (2021-05-05)


### Features

* login to forms ([#256](https://github.com/algolia/renderscript/issues/256)) ([8d5377f](https://github.com/algolia/renderscript/commit/8d5377f3bf3802a7eb67e2e19e7a9f33250d418a))

## [1.6.1](https://github.com/algolia/renderscript/compare/v1.6.0...v1.6.1) (2021-04-28)


### Bug Fixes

* dotenv ([#255](https://github.com/algolia/renderscript/issues/255)) ([8f99a90](https://github.com/algolia/renderscript/commit/8f99a9030bd9a5e3bba5da8e91a7d29334993b10))

# [1.6.0](https://github.com/algolia/renderscript/compare/v1.5.21...v1.6.0) (2021-04-28)


### Features

* pass user-agent ([#254](https://github.com/algolia/renderscript/issues/254)) ([00d14f2](https://github.com/algolia/renderscript/commit/00d14f2ab39c4c2ec8277189f4c330b9daa7788c))

## [1.5.21](https://github.com/algolia/renderscript/compare/v1.5.20...v1.5.21) (2021-04-26)


### Bug Fixes

* **deps:** update dependency puppeteer-core to v9 ([#252](https://github.com/algolia/renderscript/issues/252)) ([c16d6e0](https://github.com/algolia/renderscript/commit/c16d6e0cbbd961b9e55679b0bc7ea64acfb0da75))

## [1.5.20](https://github.com/algolia/renderscript/compare/v1.5.19...v1.5.20) (2021-04-04)


### Bug Fixes

* **deps:** update dependency hot-shots to v8.3.1 ([#235](https://github.com/algolia/renderscript/issues/235)) ([14d4a35](https://github.com/algolia/renderscript/commit/14d4a35f7e1f90882f19323f2c3d5ec8b043fb86))

## [1.5.19](https://github.com/algolia/renderscript/compare/v1.5.18...v1.5.19) (2021-03-22)


### Bug Fixes

* upgrade deps ([177e040](https://github.com/algolia/renderscript/commit/177e0408ce5fd8ec48141cfe0da86cdc1fd77ea3))

## [1.5.18](https://github.com/algolia/renderscript/compare/v1.5.17...v1.5.18) (2021-03-08)


### Bug Fixes

* **deps:** upgrade ([5fe04a8](https://github.com/algolia/renderscript/commit/5fe04a8b1a45523c0d664201f87499051af49b9d))

## [1.5.17](https://github.com/algolia/renderscript/compare/v1.5.16...v1.5.17) (2021-03-01)


### Bug Fixes

* **deps:** update dependency puppeteer-core to v8 ([#208](https://github.com/algolia/renderscript/issues/208)) ([3d810cb](https://github.com/algolia/renderscript/commit/3d810cbb116c81b91dc99a3468252ab230997567))

## [1.5.16](https://github.com/algolia/renderscript/compare/v1.5.15...v1.5.16) (2021-03-01)


### Bug Fixes

* **deps:** update dependency puppeteer-core to v7.1.0 ([#198](https://github.com/algolia/renderscript/issues/198)) ([db4dc05](https://github.com/algolia/renderscript/commit/db4dc054423e5e2682e0b316afb52c070a0e3fe6))

## [1.5.15](https://github.com/algolia/renderscript/compare/v1.5.14...v1.5.15) (2021-03-01)


### Bug Fixes

* **deps:** update dependency @algolia/dns-filter to v1.1.13 ([#207](https://github.com/algolia/renderscript/issues/207)) ([57a0c6d](https://github.com/algolia/renderscript/commit/57a0c6d1b9984920a4464fc1c161c9799376b11e))

## [1.5.14](https://github.com/algolia/renderscript/compare/v1.5.13...v1.5.14) (2021-03-01)


### Bug Fixes

* **deps:** update node.js to v14.16.0 ([#196](https://github.com/algolia/renderscript/issues/196)) ([32ffc91](https://github.com/algolia/renderscript/commit/32ffc911ddc6c74fe0d1c7d09c5c8e4cc135994b))

## [1.5.13](https://github.com/algolia/renderscript/compare/v1.5.12...v1.5.13) (2021-02-08)


### Bug Fixes

* **deps:** update dependency puppeteer-core to v7 ([#188](https://github.com/algolia/renderscript/issues/188)) ([dc5c647](https://github.com/algolia/renderscript/commit/dc5c6479d09eded76f4e3875a041bdda1360c66e))

## [1.5.12](https://github.com/algolia/renderscript/compare/v1.5.11...v1.5.12) (2021-02-08)


### Bug Fixes

* **deps:** update dependency puppeteer-core to v6 ([#187](https://github.com/algolia/renderscript/issues/187)) ([2deaa1e](https://github.com/algolia/renderscript/commit/2deaa1eb87903f46c8b49da58e9aaa7316dd2c37))

## [1.5.11](https://github.com/algolia/renderscript/compare/v1.5.10...v1.5.11) (2021-01-28)


### Bug Fixes

* various ([#180](https://github.com/algolia/renderscript/issues/180)) ([83befdc](https://github.com/algolia/renderscript/commit/83befdcf70162d52a0a556d2cb06d4a4edf4c218))

## [1.5.10](https://github.com/algolia/renderscript/compare/v1.5.9...v1.5.10) (2021-01-26)


### Bug Fixes

* URL serialisation ([7a69954](https://github.com/algolia/renderscript/commit/7a69954e48f44d0bd05b1578497473e385aeef2e))

## [1.5.9](https://github.com/algolia/renderscript/compare/v1.5.8...v1.5.9) (2021-01-26)


### Bug Fixes

* upgrade dependencies ([1bfa445](https://github.com/algolia/renderscript/commit/1bfa445aaf8057a824880651dfbc131636bd8f72))

## [1.5.8](https://github.com/algolia/renderscript/compare/v1.5.7...v1.5.8) (2021-01-26)


### Bug Fixes

* metric name + add log ([c45ee19](https://github.com/algolia/renderscript/commit/c45ee197c62276b2ffc5118cfd26f6d9d8fc2207))

## [1.5.7](https://github.com/algolia/renderscript/compare/v1.5.6...v1.5.7) (2021-01-25)


### Bug Fixes

* add tests ([#179](https://github.com/algolia/renderscript/issues/179)) ([dcd6ff3](https://github.com/algolia/renderscript/commit/dcd6ff36ffbea7a38d9e30c6a99aa1b43538532d))

## [1.5.6](https://github.com/algolia/renderscript/compare/v1.5.5...v1.5.6) (2021-01-24)


### Bug Fixes

* add metrics ([#177](https://github.com/algolia/renderscript/issues/177)) ([ab7e39b](https://github.com/algolia/renderscript/commit/ab7e39b41a0cefa2f60c02053a1b03515cbdd25b))

## [1.5.5](https://github.com/algolia/renderscript/compare/v1.5.4...v1.5.5) (2021-01-23)


### Bug Fixes

* eslint ([#176](https://github.com/algolia/renderscript/issues/176)) ([acfc6a6](https://github.com/algolia/renderscript/commit/acfc6a639ed220dd73dce30829a9a67befc1c187))

## [1.5.4](https://github.com/algolia/renderscript/compare/v1.5.3...v1.5.4) (2020-12-12)


### Bug Fixes

* **deps:** update dependency uuid to v8.3.2 ([#148](https://github.com/algolia/renderscript/issues/148)) ([fd3ea2b](https://github.com/algolia/renderscript/commit/fd3ea2bb323c0fa433c929615b3d631673275fee))

## [1.5.3](https://github.com/algolia/renderscript/compare/v1.5.2...v1.5.3) (2020-11-24)


### Bug Fixes

* update dns-filter to 1.1.11 ([#134](https://github.com/algolia/renderscript/issues/134)) ([93415c8](https://github.com/algolia/renderscript/commit/93415c80aeded803c47d69813367da9a014f965a))

## [1.5.2](https://github.com/algolia/renderscript/compare/v1.5.1...v1.5.2) (2020-11-21)


### Bug Fixes

* **deps:** update dependency puppeteer-core to v5.5.0 ([#130](https://github.com/algolia/renderscript/issues/130)) ([e2f549d](https://github.com/algolia/renderscript/commit/e2f549d))

## [1.5.1](https://github.com/algolia/renderscript/compare/v1.5.0...v1.5.1) (2020-11-18)


### Bug Fixes

* upgrade node in dockerfile ([ffb93f8](https://github.com/algolia/renderscript/commit/ffb93f8))

# [1.5.0](https://github.com/algolia/renderscript/compare/v1.4.19...v1.5.0) (2020-11-18)


### Features

* upgrade node, packages, eslint ([25c69cf](https://github.com/algolia/renderscript/commit/25c69cf))

## [1.4.19](https://github.com/algolia/renderscript/compare/v1.4.18...v1.4.19) (2020-11-01)


### Bug Fixes

* **deps:** update dependency puppeteer-core to v5.4.1 ([#115](https://github.com/algolia/renderscript/issues/115)) ([fdc7829](https://github.com/algolia/renderscript/commit/fdc7829))

## [1.4.18](https://github.com/algolia/renderscript/compare/v1.4.17...v1.4.18) (2020-10-25)


### Bug Fixes

* **deps:** update dependency puppeteer-core to v5.4.0 ([#112](https://github.com/algolia/renderscript/issues/112)) ([a0062c7](https://github.com/algolia/renderscript/commit/a0062c7))

## [1.4.17](https://github.com/algolia/renderscript/compare/v1.4.16...v1.4.17) (2020-10-09)


### Bug Fixes

* **deps:** update dependency uuid to v8.3.1 ([#102](https://github.com/algolia/renderscript/issues/102)) ([85f7bef](https://github.com/algolia/renderscript/commit/85f7bef))

## [1.4.16](https://github.com/algolia/renderscript/compare/v1.4.15...v1.4.16) (2020-09-27)


### Bug Fixes

* **deps:** update dependency puppeteer-core to v5.3.1 ([#101](https://github.com/algolia/renderscript/issues/101)) ([5a7aa40](https://github.com/algolia/renderscript/commit/5a7aa40))

## [1.4.15](https://github.com/algolia/renderscript/compare/v1.4.14...v1.4.15) (2020-09-13)


### Bug Fixes

* **deps:** update dependency puppeteer-core to v5.3.0 ([#95](https://github.com/algolia/renderscript/issues/95)) ([62d20c2](https://github.com/algolia/renderscript/commit/62d20c2))

## [1.4.14](https://github.com/algolia/renderscript/compare/v1.4.13...v1.4.14) (2020-09-12)


### Bug Fixes

* **deps:** update dependency node-fetch to v2.6.1 [security] ([#92](https://github.com/algolia/renderscript/issues/92)) ([2b92dae](https://github.com/algolia/renderscript/commit/2b92dae))

## [1.4.13](https://github.com/algolia/renderscript/compare/v1.4.12...v1.4.13) (2020-08-02)


### Bug Fixes

* **deps:** update dependency uuid to v8.3.0 ([#79](https://github.com/algolia/renderscript/issues/79)) ([53dbfab](https://github.com/algolia/renderscript/commit/53dbfab))

## [1.4.12](https://github.com/algolia/renderscript/compare/v1.4.11...v1.4.12) (2020-07-26)


### Bug Fixes

* **deps:** update dependency puppeteer-core to v5.2.1 ([#75](https://github.com/algolia/renderscript/issues/75)) ([746014a](https://github.com/algolia/renderscript/commit/746014a))

## [1.4.11](https://github.com/algolia/renderscript/compare/v1.4.10...v1.4.11) (2020-07-20)


### Bug Fixes

* **deps:** update dependency puppeteer-core to v5.2.0 ([#73](https://github.com/algolia/renderscript/issues/73)) ([fd17242](https://github.com/algolia/renderscript/commit/fd17242))

## [1.4.10](https://github.com/algolia/renderscript/compare/v1.4.9...v1.4.10) (2020-07-06)


### Bug Fixes

* **deps:** update dependency puppeteer-core to v5 ([#65](https://github.com/algolia/renderscript/issues/65)) ([44f9748](https://github.com/algolia/renderscript/commit/44f9748))

## [1.4.9](https://github.com/algolia/renderscript/compare/v1.4.8...v1.4.9) (2020-06-28)


### Bug Fixes

* **deps:** update dependency uuid to v8.2.0 ([#64](https://github.com/algolia/renderscript/issues/64)) ([46db9cf](https://github.com/algolia/renderscript/commit/46db9cf))

## [1.4.8](https://github.com/algolia/renderscript/compare/v1.4.7...v1.4.8) (2020-06-28)


### Bug Fixes

* **deps:** update dependency puppeteer-core to v4.0.1 ([#63](https://github.com/algolia/renderscript/issues/63)) ([ec51198](https://github.com/algolia/renderscript/commit/ec51198))

## [1.4.7](https://github.com/algolia/renderscript/compare/v1.4.6...v1.4.7) (2020-06-22)


### Bug Fixes

* **deps:** update dependency puppeteer-core to v4 ([#60](https://github.com/algolia/renderscript/issues/60)) ([73e4c5d](https://github.com/algolia/renderscript/commit/73e4c5d))

## [1.4.6](https://github.com/algolia/renderscript/compare/v1.4.5...v1.4.6) (2020-06-06)


### Bug Fixes

* **deps:** update dependency puppeteer-core to v3.3.0 ([#55](https://github.com/algolia/renderscript/issues/55)) ([3c6946b](https://github.com/algolia/renderscript/commit/3c6946b))

## [1.4.5](https://github.com/algolia/renderscript/compare/v1.4.4...v1.4.5) (2020-06-01)


### Bug Fixes

* **deps:** update dependency uuid to v8.1.0 ([#48](https://github.com/algolia/renderscript/issues/48)) ([29ee0c3](https://github.com/algolia/renderscript/commit/29ee0c3))

## [1.4.4](https://github.com/algolia/renderscript/compare/v1.4.3...v1.4.4) (2020-05-24)


### Bug Fixes

* **deps:** update dependency puppeteer-core to v3.1.0 ([#52](https://github.com/algolia/renderscript/issues/52)) ([16cfa4d](https://github.com/algolia/renderscript/commit/16cfa4d))

## [1.4.3](https://github.com/algolia/renderscript/compare/v1.4.2...v1.4.3) (2020-05-10)


### Bug Fixes

* **deps:** update dependency puppeteer-core to v3.0.4 ([#44](https://github.com/algolia/renderscript/issues/44)) ([7cc18cb](https://github.com/algolia/renderscript/commit/7cc18cb))

## [1.4.2](https://github.com/algolia/renderscript/compare/v1.4.1...v1.4.2) (2020-05-04)


### Bug Fixes

* **deps:** update dependency uuid to v8 ([#39](https://github.com/algolia/renderscript/issues/39)) ([46a6a6d](https://github.com/algolia/renderscript/commit/46a6a6d))

## [1.4.1](https://github.com/algolia/renderscript/compare/v1.4.0...v1.4.1) (2020-05-03)


### Bug Fixes

* **deps:** update dependency puppeteer-core to v3.0.2 ([#42](https://github.com/algolia/renderscript/issues/42)) ([0921ab3](https://github.com/algolia/renderscript/commit/0921ab3))

# [1.4.0](https://github.com/algolia/renderscript/compare/v1.3.13...v1.4.0) (2020-04-20)


### Features

* add minimal ci testing ([#32](https://github.com/algolia/renderscript/issues/32)) ([ac5156f](https://github.com/algolia/renderscript/commit/ac5156f))

## [1.3.13](https://github.com/algolia/renderscript/compare/v1.3.12...v1.3.13) (2020-04-20)


### Bug Fixes

* **deps:** update dependency puppeteer-core to v3 ([#31](https://github.com/algolia/renderscript/issues/31)) ([c3a9dc9](https://github.com/algolia/renderscript/commit/c3a9dc9))

## [1.3.12](https://github.com/algolia/renderscript/compare/v1.3.11...v1.3.12) (2020-04-20)


### Bug Fixes

* **express:** update @types/express dependencies ([1e4a5e0](https://github.com/algolia/renderscript/commit/1e4a5e0))

## [1.3.11](https://github.com/algolia/renderscript/compare/v1.3.10...v1.3.11) (2020-04-04)


### Bug Fixes

* **deps:** update dependency uuid to v7.0.3 ([42dcf72](https://github.com/algolia/renderscript/commit/42dcf72))

## [1.3.10](https://github.com/algolia/renderscript/compare/v1.3.9...v1.3.10) (2020-03-07)


### Bug Fixes

* **deps:** update dependency uuid to v7.0.2 ([81261da](https://github.com/algolia/renderscript/commit/81261da))

## [1.3.9](https://github.com/algolia/renderscript/compare/v1.3.8...v1.3.9) (2020-03-02)


### Bug Fixes

* **deps:** update dependency uuid to v7 ([#28](https://github.com/algolia/renderscript/issues/28)) ([7eda872](https://github.com/algolia/renderscript/commit/7eda872))

## [1.3.8](https://github.com/algolia/renderscript/compare/v1.3.7...v1.3.8) (2020-02-08)


### Bug Fixes

* **deps:** update dependency puppeteer-core to v2.1.1 ([aa276e4](https://github.com/algolia/renderscript/commit/aa276e4))

## [1.3.7](https://github.com/algolia/renderscript/compare/v1.3.6...v1.3.7) (2020-02-01)


### Bug Fixes

* **deps:** update dependency puppeteer-core to v2.1.0 ([7c71fd9](https://github.com/algolia/renderscript/commit/7c71fd9))

## [1.3.6](https://github.com/algolia/renderscript/compare/v1.3.5...v1.3.6) (2020-01-18)


### Bug Fixes

* **deps:** update dependency uuid to v3.4.0 ([0da2c5c](https://github.com/algolia/renderscript/commit/0da2c5c))

## [1.3.5](https://github.com/algolia/renderscript/compare/v1.3.4...v1.3.5) (2019-11-04)


### Bug Fixes

* **stale-yarn-lock:** upgrade package that is an undeclared dep o… ([#20](https://github.com/algolia/renderscript/issues/20)) ([ad52065](https://github.com/algolia/renderscript/commit/ad52065))

## [1.3.4](https://github.com/algolia/renderscript/compare/v1.3.3...v1.3.4) (2019-11-04)


### Bug Fixes

* **url-hash-redirect:** use window.location.href instead of page.url ([#19](https://github.com/algolia/renderscript/issues/19)) ([fcbe621](https://github.com/algolia/renderscript/commit/fcbe621))

## [1.3.3](https://github.com/algolia/renderscript/compare/v1.3.2...v1.3.3) (2019-10-30)


### Bug Fixes

* **docker-revert-url:** revert only after comparison ([#17](https://github.com/algolia/renderscript/issues/17)) ([74c6025](https://github.com/algolia/renderscript/commit/74c6025))

## [1.3.2](https://github.com/algolia/renderscript/compare/v1.3.1...v1.3.2) (2019-10-29)


### Bug Fixes

* **consistent-localhost:** revert url translation when checking for redirection ([#15](https://github.com/algolia/renderscript/issues/15)) ([146897b](https://github.com/algolia/renderscript/commit/146897b))

## [1.3.1](https://github.com/algolia/renderscript/compare/v1.3.0...v1.3.1) (2019-10-28)


### Bug Fixes

* **deps:** update dependency puppeteer-core to v2 ([b47abe7](https://github.com/algolia/renderscript/commit/b47abe7))

# [1.3.0](https://github.com/algolia/renderscript/compare/v1.2.3...v1.3.0) (2019-10-28)


### Features

* **forward-headers:** handle forwarding of generic headers and cookie ([#14](https://github.com/algolia/renderscript/issues/14)) ([af45367](https://github.com/algolia/renderscript/commit/af45367))

## [1.2.3](https://github.com/algolia/renderscript/compare/v1.2.2...v1.2.3) (2019-10-25)


### Bug Fixes

* **deps:** pin dependency @algolia/dns-filter to 1.1.3 ([40d307f](https://github.com/algolia/renderscript/commit/40d307f))

## [1.2.2](https://github.com/algolia/renderscript/compare/v1.2.1...v1.2.2) (2019-10-25)


### Bug Fixes

* **allow-ip-prefixes:** add environment variable to control which ips to whitelist ([#13](https://github.com/algolia/renderscript/issues/13)) ([c3fe02a](https://github.com/algolia/renderscript/commit/c3fe02a))
* **dev-setup:** use ALLOW_LOCALHOST as condition for lax filtering ([98b09eb](https://github.com/algolia/renderscript/commit/98b09eb))

## [1.2.1](https://github.com/algolia/renderscript/compare/v1.2.0...v1.2.1) (2019-10-23)


### Bug Fixes

* **dev-setup:** use USE_DOCKER_LOCALHOST as condition for lax filtering ([d826226](https://github.com/algolia/renderscript/commit/d826226))

# [1.2.0](https://github.com/algolia/renderscript/compare/v1.1.0...v1.2.0) (2019-10-23)


### Features

* **dns-filter:** reject requests to private IPs ([#10](https://github.com/algolia/renderscript/issues/10)) ([c1ff729](https://github.com/algolia/renderscript/commit/c1ff729))

# [1.1.0](https://github.com/algolia/renderscript/compare/v1.0.5...v1.1.0) (2019-10-22)


### Features

* **detect-js-redirect:** add additional failsafe against js shenaningans ([5173968](https://github.com/algolia/renderscript/commit/5173968))
* **detect-js-redirect:** return 307 when evaluated page url is different from initial url ([f5d4bb7](https://github.com/algolia/renderscript/commit/f5d4bb7))
* **detect-js-redirect:** return 307 when evaluated page url is different from initial url ([7e86629](https://github.com/algolia/renderscript/commit/7e86629))

## [1.0.5](https://github.com/algolia/renderscript/compare/v1.0.4...v1.0.5) (2019-09-14)


### Bug Fixes

* **deps:** update dependency puppeteer-core to v1.20.0 ([511ffea](https://github.com/algolia/renderscript/commit/511ffea))

## [1.0.4](https://github.com/algolia/renderscript/compare/v1.0.3...v1.0.4) (2019-08-24)


### Bug Fixes

* **deps:** update dependency uuid to v3.3.3 ([56b7989](https://github.com/algolia/renderscript/commit/56b7989))

## [1.0.3](https://github.com/algolia/renderscript/compare/v1.0.2...v1.0.3) (2019-07-27)


### Bug Fixes

* **deps:** update dependency puppeteer-core to v1.19.0 ([f3878da](https://github.com/algolia/renderscript/commit/f3878da))

## [1.0.2](https://github.com/algolia/renderscript/compare/v1.0.1...v1.0.2) (2019-06-29)


### Bug Fixes

* **deps:** update dependency puppeteer-core to v1.18.1 ([79ed9b8](https://github.com/algolia/renderscript/commit/79ed9b8))

## [1.0.1](https://github.com/algolia/renderscript/compare/v1.0.0...v1.0.1) (2019-06-22)


### Bug Fixes

* **deps:** update dependency puppeteer-core to v1.18.0 ([828701f](https://github.com/algolia/renderscript/commit/828701f))

# 1.0.0 (2019-06-17)


### Bug Fixes

* **deps:** update dependency express to v4.17.1 ([f138d8b](https://github.com/algolia/renderscript/commit/f138d8b))
* **ready:** remove wrongly committed leftover ([816b86d](https://github.com/algolia/renderscript/commit/816b86d))
* **render:** fix POST version of render ([6003ac5](https://github.com/algolia/renderscript/commit/6003ac5))
* **Renderer:** await pageBuffer when stopping ([f79804f](https://github.com/algolia/renderscript/commit/f79804f))
* **start.sh:** allow graceful exit ([d6adcef](https://github.com/algolia/renderscript/commit/d6adcef))


### Features

* add static content ([c5d93b9](https://github.com/algolia/renderscript/commit/c5d93b9))
* update ([243f4a7](https://github.com/algolia/renderscript/commit/243f4a7))
* v1.0.0 ([95c6e5e](https://github.com/algolia/renderscript/commit/95c6e5e))
* various improvements ([ea684f9](https://github.com/algolia/renderscript/commit/ea684f9))
* **docker:** add support for localhost ([cbe34c2](https://github.com/algolia/renderscript/commit/cbe34c2))
* **render:** better error handling ([3d5ca5f](https://github.com/algolia/renderscript/commit/3d5ca5f))
* **timeout:** handle timeouts gracefully ([4d3f553](https://github.com/algolia/renderscript/commit/4d3f553))
