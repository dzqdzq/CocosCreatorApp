"use strict";Object.defineProperty(exports,"__esModule",{value:!0}),exports.onAfterBuild=exports.onBeforeBundleInit=exports.throwError=void 0;const fs_extra_1=require("fs-extra"),path_1=require("path"),PACKAGE_NAME="adsense-h5g-plugin",scriptUuids=(exports.throwError=!0,["b8d97018-1648-4f7f-b2c7-941dcbde2a17","b502a825-f7c2-4ee4-b75e-605528f25515","fd80a9b5-5b61-4c02-af13-e6508e6644ff","e7ecae40-ddb1-4ac1-8abf-0382e9d40f02","3c6b2349-eaf5-4afc-893a-894cd8511526","e0c4e2c7-5823-4fba-8095-6ad5a9830da6"]);async function onBeforeBundleInit(e,o,t){return e.preview||["web-mobile","web-desktop"].includes(e.platform)&&await Editor.Profile.getProject(PACKAGE_NAME,"enableAdsense")?void 0:void removeScriptFromCache(t)}function removeScriptFromCache(o){scriptUuids.forEach(e=>o.removeAsset(e)),console.debug("[adsense-h5g-plugin] remove script success")}exports.onBeforeBundleInit=onBeforeBundleInit;const onAfterBuild=async function(r,a){if(["web-mobile","web-desktop"].includes(r.platform)&&await Editor.Profile.getProject(PACKAGE_NAME,"enableAdsense")){const s=r.packages[PACKAGE_NAME];if(s){r=(0,path_1.join)(a.paths.dir,"index.html");const n=s.enableTestAd?'data-adbreak-test="on"':"";let o="",t="",e=(t="other"===s.AFPHostPropertyCode&&s.otherAFPHostPropertyCode?(o=s.otherAFPHostPropertyCode,s.otherAFPDomain):(o=s.AFPHostPropertyCode,s.AFPHostDomain),await(0,fs_extra_1.readFile)(r,"utf8"));e=e.replace("</head>",function(e){return`
  <meta name="google-adsense-platform-domain" content="${t}">
  <meta name="google-adsense-platform-account" content="${o}">
  <script async
    data-ad-client="${s.adsensePropertyCode}"
    ${n}
    data-ad-host="${o}"
    src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js">
  </script>
  <script>
    window.adsbygoogle = window.adsbygoogle || [];
    var adBreak = adConfig = function(o) {adsbygoogle.push(o);}
  </script>
</head>
            `}),await(0,fs_extra_1.writeFile)(r,e)}}};exports.onAfterBuild=onAfterBuild;