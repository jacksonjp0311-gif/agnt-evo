import{u as q,o as Y,r as F}from"./vendor-vue.B4lmn9tu.js";function K(n,p=null){const i=q(),o=F(!1);Y(()=>{if(typeof window<"u"&&!window.confetti){const s=document.createElement("script");s.src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.2/dist/confetti.browser.min.js",document.head.appendChild(s)}});const a=(s,d="info")=>{p&&typeof p=="function"&&p(s,d),console.log(`[MarketplaceInstall] ${s}`)},y=()=>{const d=Date.now()+3e3,t={startVelocity:30,spread:360,ticks:60,zIndex:2e3};function m(r,c){return Math.random()*(c-r)+r}const u=setInterval(function(){const r=d-Date.now();if(r<=0)return clearInterval(u);const c=50*(r/3e3);window.confetti&&(window.confetti({...t,particleCount:c,origin:{x:m(.1,.3),y:Math.random()-.2}}),window.confetti({...t,particleCount:c,origin:{x:m(.7,.9),y:Math.random()-.2}}))},250)},I=async(s,d=null)=>{var r,c,v,C,P,T,k,x,b,E,M;if(!s)return console.error("[MarketplaceInstall] No item provided"),{success:!1,error:"No item provided"};const t=d||s.asset_type||"workflow",m=t.charAt(0).toUpperCase()+t.slice(1),u=s.title||s.name||"Unknown Item";o.value=!0;try{if(s.price&&s.price>0&&!await i.dispatch("marketplace/checkPurchaseStatus",s.id))return await((r=n.value)==null?void 0:r.showModal({title:"Purchase Required",message:`"${u}" costs $${s.price.toFixed(2)}.

You'll be redirected to Stripe to complete your purchase.`,confirmText:"Purchase Now",cancelText:"Cancel",showCancel:!0,confirmClass:"btn-primary"}))&&(a(`Redirecting to checkout for "${u}"...`,"info"),await i.dispatch("marketplace/purchaseItem",{itemId:s.id})),o.value=!1,{success:!1,cancelled:!0};a(`Installing "${u}"...`,"info");let e=await i.dispatch("marketplace/installWorkflow",{workflowId:s.id,auto_update:!1});if(e&&e.needsPlugins&&((c=e.missingPlugins)==null?void 0:c.length)>0){const g=e.missingPlugins.map(l=>`• ${l.displayName||l.name}`).join(`
`);if(!await((v=n.value)==null?void 0:v.showModal({title:"Plugins Required",message:`This ${t} requires plugins that aren't installed:

${g}

Install them now?`,confirmText:"Install Plugins",cancelText:"Cancel",showCancel:!0,confirmClass:"btn-primary"})))return o.value=!1,a("Installation cancelled - missing required plugins","warning"),{success:!1,cancelled:!0};const S=e.missingPlugins.length,h=[];for(let l=0;l<e.missingPlugins.length;l++){const w=e.missingPlugins[l],f=w.displayName||w.name;a(`Installing plugin ${l+1}/${S}: ${f}...`,"info");try{await i.dispatch("marketplace/installPlugin",{pluginName:w.name,skipRefresh:!0}),h.push(f),a(`✓ ${f} installed`,"success")}catch($){return a(`✗ Failed to install ${f}: ${$.message}`,"error"),await((C=n.value)==null?void 0:C.showModal({title:"✗ Plugin Installation Failed",message:`Failed to install required plugin "${f}":

${$.message}

The ${t} was not installed.`,confirmText:"OK",showCancel:!1,confirmClass:"btn-danger"})),o.value=!1,{success:!1,error:$.message}}}a("Refreshing tools...","info"),await i.dispatch("tools/refreshAllTools"),window.dispatchEvent(new CustomEvent("plugin-installed",{detail:{count:h.length}}));const D=h.map(l=>`• ${l}`).join(`
`);await((P=n.value)==null?void 0:P.showModal({title:"✓ Plugins Installed",message:`Successfully installed ${h.length} plugin(s):

${D}

Now installing the ${t}...`,confirmText:"Continue",showCancel:!1,confirmClass:"btn-primary"})),a(`Saving ${t}...`,"info"),await i.dispatch("marketplace/saveInstalledAsset",{assetType:e.assetType,assetData:e.assetData}),e={assetId:((T=e.assetData)==null?void 0:T.id)||e.assetId}}return a(`✓ ${m} installed successfully!`,"success"),a(`  New ${t} ID: ${e.assetId}`,"info"),a(`  You can now find it in your ${t}s list`,"info"),await Promise.all([i.dispatch("marketplace/fetchMyInstalls"),i.dispatch("marketplace/fetchMyPurchases")]),y(),await((k=n.value)==null?void 0:k.showModal({title:"✓ Installed Successfully",message:`"${u}" has been installed!

New ${t} ID: ${e.assetId}

You can now find it in your ${t}s list.`,confirmText:"OK",showCancel:!1,confirmClass:"btn-primary"})),o.value=!1,{success:!0,result:e}}catch(e){return console.error("Install error:",e),o.value=!1,e.code==="PAYMENT_REQUIRED"?(a(`✗ This ${t} costs $${s.price}. Payment required.`,"error"),await((x=n.value)==null?void 0:x.showModal({title:"Payment Required",message:`This ${t} costs $${s.price.toFixed(2)}.

You'll be redirected to Stripe to complete your purchase.`,confirmText:"Purchase Now",cancelText:"Cancel",showCancel:!0,confirmClass:"btn-primary"}))&&await i.dispatch("marketplace/purchaseItem",{itemId:s.id})):e.message.includes("already installed")?(a(`✗ You have already installed this ${t}.`,"error"),await((b=n.value)==null?void 0:b.showModal({title:"✗ Already Installed",message:`You have already installed this ${t}.`,confirmText:"OK",showCancel:!1,confirmClass:"btn-secondary"}))):e.message.includes("invalid payment setup")?(a("✗ This item has invalid payment configuration.","error"),await((E=n.value)==null?void 0:E.showModal({title:"✗ Payment Setup Error",message:`This item cannot be purchased due to invalid payment configuration.

The publisher needs to fix their Stripe Connect setup.

Error: ${e.message}`,confirmText:"OK",showCancel:!1,confirmClass:"btn-danger"}))):(a(`✗ Error installing ${t}: ${e.message}`,"error"),await((M=n.value)==null?void 0:M.showModal({title:"✗ Installation Error",message:`Failed to install ${t}:

${e.message}`,confirmText:"OK",showCancel:!1,confirmClass:"btn-danger"}))),{success:!1,error:e.message}}};return{isInstalling:o,handleInstall:I,installMarketplaceItem:I,triggerConfetti:y}}export{K as u};
