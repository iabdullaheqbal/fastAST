var Ov=Object.defineProperty;var wv=(s,o,m)=>o in s?Ov(s,o,{enumerable:!0,configurable:!0,writable:!0,value:m}):s[o]=m;var ro=(s,o,m)=>wv(s,typeof o!="symbol"?o+"":o,m);(function(){const o=document.createElement("link").relList;if(o&&o.supports&&o.supports("modulepreload"))return;for(const d of document.querySelectorAll('link[rel="modulepreload"]'))c(d);new MutationObserver(d=>{for(const p of d)if(p.type==="childList")for(const v of p.addedNodes)v.tagName==="LINK"&&v.rel==="modulepreload"&&c(v)}).observe(document,{childList:!0,subtree:!0});function m(d){const p={};return d.integrity&&(p.integrity=d.integrity),d.referrerPolicy&&(p.referrerPolicy=d.referrerPolicy),d.crossOrigin==="use-credentials"?p.credentials="include":d.crossOrigin==="anonymous"?p.credentials="omit":p.credentials="same-origin",p}function c(d){if(d.ep)return;d.ep=!0;const p=m(d);fetch(d.href,p)}})();function Mv(s){return s&&s.__esModule&&Object.prototype.hasOwnProperty.call(s,"default")?s.default:s}var co={exports:{}},$i={};/**
 * @license React
 * react-jsx-runtime.production.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var ep;function Dv(){if(ep)return $i;ep=1;var s=Symbol.for("react.transitional.element"),o=Symbol.for("react.fragment");function m(c,d,p){var v=null;if(p!==void 0&&(v=""+p),d.key!==void 0&&(v=""+d.key),"key"in d){p={};for(var T in d)T!=="key"&&(p[T]=d[T])}else p=d;return d=p.ref,{$$typeof:s,type:c,key:v,ref:d!==void 0?d:null,props:p}}return $i.Fragment=o,$i.jsx=m,$i.jsxs=m,$i}var tp;function Uv(){return tp||(tp=1,co.exports=Dv()),co.exports}var u=Uv(),oo={exports:{}},ge={};/**
 * @license React
 * react.production.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var lp;function Lv(){if(lp)return ge;lp=1;var s=Symbol.for("react.transitional.element"),o=Symbol.for("react.portal"),m=Symbol.for("react.fragment"),c=Symbol.for("react.strict_mode"),d=Symbol.for("react.profiler"),p=Symbol.for("react.consumer"),v=Symbol.for("react.context"),T=Symbol.for("react.forward_ref"),N=Symbol.for("react.suspense"),z=Symbol.for("react.memo"),y=Symbol.for("react.lazy"),g=Symbol.for("react.activity"),A=Symbol.for("react.view_transition"),B=Symbol.iterator;function U(h){return h===null||typeof h!="object"?null:(h=B&&h[B]||h["@@iterator"],typeof h=="function"?h:null)}var k={isMounted:function(){return!1},enqueueForceUpdate:function(){},enqueueReplaceState:function(){},enqueueSetState:function(){}},q=Object.assign,Y={};function ee(h,D,C){this.props=h,this.context=D,this.refs=Y,this.updater=C||k}ee.prototype.isReactComponent={},ee.prototype.setState=function(h,D){if(typeof h!="object"&&typeof h!="function"&&h!=null)throw Error("takes an object of state variables to update or a function which returns an object of state variables.");this.updater.enqueueSetState(this,h,D,"setState")},ee.prototype.forceUpdate=function(h){this.updater.enqueueForceUpdate(this,h,"forceUpdate")};function le(){}le.prototype=ee.prototype;function F(h,D,C){this.props=h,this.context=D,this.refs=Y,this.updater=C||k}var J=F.prototype=new le;J.constructor=F,q(J,ee.prototype),J.isPureReactComponent=!0;var xe=Array.isArray;function I(){}var ie={H:null,A:null,T:null,S:null},He=Object.prototype.hasOwnProperty;function Z(h,D,C){var G=C.ref;return{$$typeof:s,type:h,key:D,ref:G!==void 0?G:null,props:C}}function Be(h,D){return Z(h.type,D,h.props)}function Ne(h){return typeof h=="object"&&h!==null&&h.$$typeof===s}function Ee(h){var D={"=":"=0",":":"=2"};return"$"+h.replace(/[=:]/g,function(C){return D[C]})}var Fe=/\/+/g;function je(h,D){return typeof h=="object"&&h!==null&&h.key!=null?Ee(""+h.key):D.toString(36)}function K(h){switch(h.status){case"fulfilled":return h.value;case"rejected":throw h.reason;default:switch(typeof h.status=="string"?h.then(I,I):(h.status="pending",h.then(function(D){h.status==="pending"&&(h.status="fulfilled",h.value=D)},function(D){h.status==="pending"&&(h.status="rejected",h.reason=D)})),h.status){case"fulfilled":return h.value;case"rejected":throw h.reason}}throw h}function re(h,D,C,G,de){var se=typeof h;(se==="undefined"||se==="boolean")&&(h=null);var Ae=!1;if(h===null)Ae=!0;else switch(se){case"bigint":case"string":case"number":Ae=!0;break;case"object":switch(h.$$typeof){case s:case o:Ae=!0;break;case y:return Ae=h._init,re(Ae(h._payload),D,C,G,de)}}if(Ae)return de=de(h),Ae=G===""?"."+je(h,0):G,xe(de)?(C="",Ae!=null&&(C=Ae.replace(Fe,"$&/")+"/"),re(de,D,C,"",function(Me){return Me})):de!=null&&(Ne(de)&&(de=Be(de,C+(de.key==null||h&&h.key===de.key?"":(""+de.key).replace(Fe,"$&/")+"/")+Ae)),D.push(de)),1;Ae=0;var ae=G===""?".":G+":";if(xe(h))for(var ne=0;ne<h.length;ne++)G=h[ne],se=ae+je(G,ne),Ae+=re(G,D,C,se,de);else if(ne=U(h),typeof ne=="function")for(h=ne.call(h),ne=0;!(G=h.next()).done;)G=G.value,se=ae+je(G,ne++),Ae+=re(G,D,C,se,de);else if(se==="object"){if(typeof h.then=="function")return re(K(h),D,C,G,de);throw D=String(h),Error("Objects are not valid as a React child (found: "+(D==="[object Object]"?"object with keys {"+Object.keys(h).join(", ")+"}":D)+"). If you meant to render a collection of children, use an array instead.")}return Ae}function ue(h,D,C){if(h==null)return h;var G=[],de=0;return re(h,G,"","",function(se){return D.call(C,se,de++)}),G}function ze(h){if(h._status===-1){var D=h._result,C=D();C.then(function(G){(h._status===0||h._status===-1)&&(h._status=1,h._result=G,C.status===void 0&&(C.status="fulfilled",C.value=G))},function(G){(h._status===0||h._status===-1)&&(h._status=2,h._result=G,C.status===void 0&&(C.status="rejected",C.reason=G))}),h._status===-1&&(h._status=0,h._result=C)}if(h._status===1)return h._result.default;throw h._result}var ce=typeof reportError=="function"?reportError:function(h){if(typeof window=="object"&&typeof window.ErrorEvent=="function"){var D=new window.ErrorEvent("error",{bubbles:!0,cancelable:!0,message:typeof h=="object"&&h!==null&&typeof h.message=="string"?String(h.message):String(h),error:h});if(!window.dispatchEvent(D))return}else if(typeof process=="object"&&typeof process.emit=="function"){process.emit("uncaughtException",h);return}console.error(h)};function nt(h){var D=ie.T,C={};C.types=D!==null?D.types:null,ie.T=C;try{var G=h(),de=ie.S;de!==null&&de(C,G),typeof G=="object"&&G!==null&&typeof G.then=="function"&&G.then(I,ce)}catch(se){ce(se)}finally{D!==null&&C.types!==null&&(D.types=C.types),ie.T=D}}function Q(h){var D=ie.T;if(D!==null){var C=D.types;C===null?D.types=[h]:C.indexOf(h)===-1&&C.push(h)}else nt(Q.bind(null,h))}var fe={map:ue,forEach:function(h,D,C){ue(h,function(){D.apply(this,arguments)},C)},count:function(h){var D=0;return ue(h,function(){D++}),D},toArray:function(h){return ue(h,function(D){return D})||[]},only:function(h){if(!Ne(h))throw Error("React.Children.only expected to receive a single React element child.");return h}};return ge.Activity=g,ge.Children=fe,ge.Component=ee,ge.Fragment=m,ge.Profiler=d,ge.PureComponent=F,ge.StrictMode=c,ge.Suspense=N,ge.ViewTransition=A,ge.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE=ie,ge.__COMPILER_RUNTIME={__proto__:null,c:function(h){return ie.H.useMemoCache(h)}},ge.addTransitionType=Q,ge.cache=function(h){return function(){return h.apply(null,arguments)}},ge.cacheSignal=function(){return null},ge.cloneElement=function(h,D,C){if(h==null)throw Error("The argument must be a React element, but you passed "+h+".");var G=q({},h.props),de=h.key;if(D!=null)for(se in D.key!==void 0&&(de=""+D.key),D)!He.call(D,se)||se==="key"||se==="__self"||se==="__source"||se==="ref"&&D.ref===void 0||(G[se]=D[se]);var se=arguments.length-2;if(se===1)G.children=C;else if(1<se){for(var Ae=Array(se),ae=0;ae<se;ae++)Ae[ae]=arguments[ae+2];G.children=Ae}return Z(h.type,de,G)},ge.createContext=function(h){return h={$$typeof:v,_currentValue:h,_currentValue2:h,_threadCount:0,Provider:null,Consumer:null},h.Provider=h,h.Consumer={$$typeof:p,_context:h},h},ge.createElement=function(h,D,C){var G,de={},se=null;if(D!=null)for(G in D.key!==void 0&&(se=""+D.key),D)He.call(D,G)&&G!=="key"&&G!=="__self"&&G!=="__source"&&(de[G]=D[G]);var Ae=arguments.length-2;if(Ae===1)de.children=C;else if(1<Ae){for(var ae=Array(Ae),ne=0;ne<Ae;ne++)ae[ne]=arguments[ne+2];de.children=ae}if(h&&h.defaultProps)for(G in Ae=h.defaultProps,Ae)de[G]===void 0&&(de[G]=Ae[G]);return Z(h,se,de)},ge.createRef=function(){return{current:null}},ge.forwardRef=function(h){return{$$typeof:T,render:h}},ge.isValidElement=Ne,ge.lazy=function(h){return{$$typeof:y,_payload:{_status:-1,_result:h},_init:ze}},ge.memo=function(h,D){return{$$typeof:z,type:h,compare:D===void 0?null:D}},ge.startTransition=nt,ge.unstable_useCacheRefresh=function(){return ie.H.useCacheRefresh()},ge.use=function(h){return ie.H.use(h)},ge.useActionState=function(h,D,C){return ie.H.useActionState(h,D,C)},ge.useCallback=function(h,D){return ie.H.useCallback(h,D)},ge.useContext=function(h){return ie.H.useContext(h)},ge.useDebugValue=function(){},ge.useDeferredValue=function(h,D){return ie.H.useDeferredValue(h,D)},ge.useEffect=function(h,D){return ie.H.useEffect(h,D)},ge.useEffectEvent=function(h){return ie.H.useEffectEvent(h)},ge.useId=function(){return ie.H.useId()},ge.useImperativeHandle=function(h,D,C){return ie.H.useImperativeHandle(h,D,C)},ge.useInsertionEffect=function(h,D){return ie.H.useInsertionEffect(h,D)},ge.useLayoutEffect=function(h,D){return ie.H.useLayoutEffect(h,D)},ge.useMemo=function(h,D){return ie.H.useMemo(h,D)},ge.useOptimistic=function(h,D){return ie.H.useOptimistic(h,D)},ge.useReducer=function(h,D,C){return ie.H.useReducer(h,D,C)},ge.useRef=function(h){return ie.H.useRef(h)},ge.useState=function(h){return ie.H.useState(h)},ge.useSyncExternalStore=function(h,D,C){return ie.H.useSyncExternalStore(h,D,C)},ge.useTransition=function(){return ie.H.useTransition()},ge.version="19.3.1",ge}var ap;function _o(){return ap||(ap=1,oo.exports=Lv()),oo.exports}var b=_o();const Cs=Mv(b);var fo={exports:{}},Fi={},mo={exports:{}},ho={};/**
 * @license React
 * scheduler.production.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var np;function Hv(){return np||(np=1,function(s){function o(K,re){var ue=K.length;K.push(re);e:for(;0<ue;){var ze=ue-1>>>1,ce=K[ze];if(0<d(ce,re))K[ze]=re,K[ue]=ce,ue=ze;else break e}}function m(K){return K.length===0?null:K[0]}function c(K){if(K.length===0)return null;var re=K[0],ue=K.pop();if(ue!==re){K[0]=ue;e:for(var ze=0,ce=K.length,nt=ce>>>1;ze<nt;){var Q=2*(ze+1)-1,fe=K[Q],h=Q+1,D=K[h];if(0>d(fe,ue))h<ce&&0>d(D,fe)?(K[ze]=D,K[h]=ue,ze=h):(K[ze]=fe,K[Q]=ue,ze=Q);else if(h<ce&&0>d(D,ue))K[ze]=D,K[h]=ue,ze=h;else break e}}return re}function d(K,re){var ue=K.sortIndex-re.sortIndex;return ue!==0?ue:K.id-re.id}if(s.unstable_now=void 0,typeof performance=="object"&&typeof performance.now=="function"){var p=performance;s.unstable_now=function(){return p.now()}}else{var v=Date,T=v.now();s.unstable_now=function(){return v.now()-T}}var N=[],z=[],y=1,g=null,A=3,B=!1,U=!1,k=!1,q=!1,Y=typeof setTimeout=="function"?setTimeout:null,ee=typeof clearTimeout=="function"?clearTimeout:null,le=typeof setImmediate<"u"?setImmediate:null;function F(K){for(var re=m(z);re!==null;){if(re.callback===null)c(z);else if(re.startTime<=K)c(z),re.sortIndex=re.expirationTime,o(N,re);else break;re=m(z)}}function J(K){if(k=!1,F(K),!U)if(m(N)!==null)U=!0,xe||(xe=!0,Ne());else{var re=m(z);re!==null&&je(J,re.startTime-K)}}var xe=!1,I=-1,ie=5,He=-1;function Z(){return q?!0:!(s.unstable_now()-He<ie)}function Be(){if(q=!1,xe){var K=s.unstable_now();He=K;var re=!0;try{e:{U=!1,k&&(k=!1,ee(I),I=-1),B=!0;var ue=A;try{t:{for(F(K),g=m(N);g!==null&&!(g.expirationTime>K&&Z());){var ze=g.callback;if(typeof ze=="function"){g.callback=null,A=g.priorityLevel;var ce=ze(g.expirationTime<=K);if(K=s.unstable_now(),typeof ce=="function"){g.callback=ce,F(K),re=!0;break t}g===m(N)&&c(N),F(K)}else c(N);g=m(N)}if(g!==null)re=!0;else{var nt=m(z);nt!==null&&je(J,nt.startTime-K),re=!1}}break e}finally{g=null,A=ue,B=!1}re=void 0}}finally{re?Ne():xe=!1}}}var Ne;if(typeof le=="function")Ne=function(){le(Be)};else if(typeof MessageChannel<"u"){var Ee=new MessageChannel,Fe=Ee.port2;Ee.port1.onmessage=Be,Ne=function(){Fe.postMessage(null)}}else Ne=function(){Y(Be,0)};function je(K,re){I=Y(function(){K(s.unstable_now())},re)}s.unstable_IdlePriority=5,s.unstable_ImmediatePriority=1,s.unstable_LowPriority=4,s.unstable_NormalPriority=3,s.unstable_Profiling=null,s.unstable_UserBlockingPriority=2,s.unstable_cancelCallback=function(K){K.callback=null},s.unstable_forceFrameRate=function(K){0>K||125<K?console.error("forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported"):ie=0<K?Math.floor(1e3/K):5},s.unstable_getCurrentPriorityLevel=function(){return A},s.unstable_next=function(K){switch(A){case 1:case 2:case 3:var re=3;break;default:re=A}var ue=A;A=re;try{return K()}finally{A=ue}},s.unstable_requestPaint=function(){q=!0},s.unstable_runWithPriority=function(K,re){switch(K){case 1:case 2:case 3:case 4:case 5:break;default:K=3}var ue=A;A=K;try{return re()}finally{A=ue}},s.unstable_scheduleCallback=function(K,re,ue){var ze=s.unstable_now();switch(typeof ue=="object"&&ue!==null?(ue=ue.delay,ue=typeof ue=="number"&&0<ue?ze+ue:ze):ue=ze,K){case 1:var ce=-1;break;case 2:ce=250;break;case 5:ce=1073741823;break;case 4:ce=1e4;break;default:ce=5e3}return ce=ue+ce,K={id:y++,callback:re,priorityLevel:K,startTime:ue,expirationTime:ce,sortIndex:-1},ue>ze?(K.sortIndex=ue,o(z,K),m(N)===null&&K===m(z)&&(k?(ee(I),I=-1):k=!0,je(J,ue-ze))):(K.sortIndex=ce,o(N,K),U||B||(U=!0,xe||(xe=!0,Ne()))),K},s.unstable_shouldYield=Z,s.unstable_wrapCallback=function(K){var re=A;return function(){var ue=A;A=re;try{return K.apply(this,arguments)}finally{A=ue}}}}(ho)),ho}var ip;function Bv(){return ip||(ip=1,mo.exports=Hv()),mo.exports}var po={exports:{}},_t={};/**
 * @license React
 * react-dom.production.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var up;function qv(){if(up)return _t;up=1;var s=_o();function o(y){var g="https://react.dev/errors/"+y;if(1<arguments.length){g+="?args[]="+encodeURIComponent(arguments[1]);for(var A=2;A<arguments.length;A++)g+="&args[]="+encodeURIComponent(arguments[A])}return"Minified React error #"+y+"; visit "+g+" for the full message or use the non-minified dev environment for full errors and additional helpful warnings."}function m(){}var c={d:{f:m,r:function(){throw Error(o(522))},D:m,C:m,L:m,m,X:m,S:m,M:m},p:0,findDOMNode:null},d=Symbol.for("react.portal"),p=Symbol.for("react.recoverable"),v=Symbol.for("react.optimistic_key");function T(y,g,A){var B=3<arguments.length&&arguments[3]!==void 0?arguments[3]:null;return{$$typeof:d,key:B==null?null:B===v?v:""+B,children:y,containerInfo:g,implementation:A}}var N=s.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;function z(y,g){if(y==="font")return"";if(typeof g=="string")return g==="use-credentials"?g:""}return _t.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE=c,_t.browser=function(y){return{$$typeof:p,_reason:y}},_t.createPortal=function(y,g){var A=2<arguments.length&&arguments[2]!==void 0?arguments[2]:null;if(!g||g.nodeType!==1&&g.nodeType!==9&&g.nodeType!==11)throw Error(o(299));return T(y,g,null,A)},_t.flushSync=function(y){var g=N.T,A=c.p;try{if(N.T=null,c.p=2,y)return y()}finally{N.T=g,c.p=A,c.d.f()}},_t.preconnect=function(y,g){typeof y=="string"&&(g?(g=g.crossOrigin,g=typeof g=="string"?g==="use-credentials"?g:"":void 0):g=null,c.d.C(y,g))},_t.prefetchDNS=function(y){typeof y=="string"&&c.d.D(y)},_t.preinit=function(y,g){if(typeof y=="string"&&g&&typeof g.as=="string"){var A=g.as,B=z(A,g.crossOrigin),U=typeof g.integrity=="string"?g.integrity:void 0,k=typeof g.fetchPriority=="string"?g.fetchPriority:void 0;A==="style"?c.d.S(y,typeof g.precedence=="string"?g.precedence:void 0,{crossOrigin:B,integrity:U,fetchPriority:k}):A==="script"&&c.d.X(y,{crossOrigin:B,integrity:U,fetchPriority:k,nonce:typeof g.nonce=="string"?g.nonce:void 0})}},_t.preinitModule=function(y,g){if(typeof y=="string")if(typeof g=="object"&&g!==null){if(g.as==null||g.as==="script"){var A=z(g.as,g.crossOrigin);c.d.M(y,{crossOrigin:A,integrity:typeof g.integrity=="string"?g.integrity:void 0,nonce:typeof g.nonce=="string"?g.nonce:void 0,fetchPriority:typeof g.fetchPriority=="string"?g.fetchPriority:void 0})}}else g==null&&c.d.M(y)},_t.preload=function(y,g){if(typeof y=="string"&&typeof g=="object"&&g!==null&&typeof g.as=="string"){var A=g.as,B=z(A,g.crossOrigin);c.d.L(y,A,{crossOrigin:B,integrity:typeof g.integrity=="string"?g.integrity:void 0,nonce:typeof g.nonce=="string"?g.nonce:void 0,type:typeof g.type=="string"?g.type:void 0,fetchPriority:typeof g.fetchPriority=="string"?g.fetchPriority:void 0,referrerPolicy:typeof g.referrerPolicy=="string"?g.referrerPolicy:void 0,imageSrcSet:typeof g.imageSrcSet=="string"?g.imageSrcSet:void 0,imageSizes:typeof g.imageSizes=="string"?g.imageSizes:void 0,media:typeof g.media=="string"?g.media:void 0})}},_t.preloadModule=function(y,g){if(typeof y=="string")if(g){var A=z(g.as,g.crossOrigin);c.d.m(y,{as:typeof g.as=="string"&&g.as!=="script"?g.as:void 0,crossOrigin:A,integrity:typeof g.integrity=="string"?g.integrity:void 0,nonce:typeof g.nonce=="string"?g.nonce:void 0,fetchPriority:typeof g.fetchPriority=="string"?g.fetchPriority:void 0})}else c.d.m(y)},_t.requestFormReset=function(y){c.d.r(y)},_t.unstable_batchedUpdates=function(y,g){return y(g)},_t.useFormState=function(y,g,A){return N.H.useFormState(y,g,A)},_t.useFormStatus=function(){return N.H.useHostTransitionStatus()},_t.version="19.3.1",_t}var sp;function Yv(){if(sp)return po.exports;sp=1;function s(){if(!(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__>"u"||typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE!="function"))try{__REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(s)}catch(o){console.error(o)}}return s(),po.exports=qv(),po.exports}/**
 * @license React
 * react-dom-client.production.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var rp;function Gv(){if(rp)return Fi;rp=1;var s=Bv(),o=_o(),m=Yv();function c(e){var t="https://react.dev/errors/"+e;if(1<arguments.length){t+="?args[]="+encodeURIComponent(arguments[1]);for(var l=2;l<arguments.length;l++)t+="&args[]="+encodeURIComponent(arguments[l])}return"Minified React error #"+e+"; visit "+t+" for the full message or use the non-minified dev environment for full errors and additional helpful warnings."}function d(e){return!(!e||e.nodeType!==1&&e.nodeType!==9&&e.nodeType!==11)}function p(e){for(var t=e,l=t;l&&!l.alternate;)t=l,t.flags&4098&&(e=t.return),l=t.return;for(;t.return;)t=t.return;return t.tag===3?e:null}function v(e){if(e.tag===13){var t=e.memoizedState;if(t===null&&(e=e.alternate,e!==null&&(t=e.memoizedState)),t!==null)return t.dehydrated}return null}function T(e){if(e.tag===31){var t=e.memoizedState;if(t===null&&(e=e.alternate,e!==null&&(t=e.memoizedState)),t!==null)return t.dehydrated}return null}function N(e){if(p(e)!==e)throw Error(c(188))}function z(e){var t=e.alternate;if(!t){if(t=p(e),t===null)throw Error(c(188));return t!==e?null:e}for(var l=e,a=t;;){var n=l.return;if(n===null)break;var i=n.alternate;if(i===null){if(a=n.return,a!==null){l=a;continue}break}if(n.child===i.child){for(i=n.child;i;){if(i===l)return N(n),e;if(i===a)return N(n),t;i=i.sibling}throw Error(c(188))}if(l.return!==a.return)l=n,a=i;else{for(var r=!1,f=n.child;f;){if(f===l){r=!0,l=n,a=i;break}if(f===a){r=!0,a=n,l=i;break}f=f.sibling}if(!r){for(f=i.child;f;){if(f===l){r=!0,l=i,a=n;break}if(f===a){r=!0,a=i,l=n;break}f=f.sibling}if(!r)throw Error(c(189))}}if(l.alternate!==a)throw Error(c(190))}if(l.tag!==3)throw Error(c(188));return l.stateNode.current===l?e:t}function y(e){var t=e.tag;if(t===5||t===26||t===27||t===6)return e;for(e=e.child;e!==null;){if(t=y(e),t!==null)return t;e=e.sibling}return null}function g(e,t,l,a,n,i){for(;e!==null;){if((e.tag===5||e.tag===27||e.tag===6)&&l(e,a,n,i)||(e.tag!==22||e.memoizedState===null)&&(t||e.tag!==5&&e.tag!==27)&&g(e.child,t,l,a,n,i))return!0;e=e.sibling}return!1}function A(e){for(e=e.return;e!==null;){if(e.tag===3||e.tag===5||e.tag===27)return e;e=e.return}return null}function B(e){var t=!1;for(e=e.return;e!==null&&(e.tag===4&&(t=!0),!(e.tag===3||e.tag===5||e.tag===27));)e=e.return;return t}function U(e){var t=[null,null],l=A(e);return l===null||k(t,e,l.child,{foundSelf:!1}),t}function k(e,t,l,a){for(;l!==null;){if(l===t)a.foundSelf=!0;else if(l.tag===5||l.tag===27||l.tag===6){if(a.foundSelf)return e[1]=l,!0;e[0]=l}else if((l.tag!==22||l.memoizedState===null)&&k(e,t,l.child,a))return!0;l=l.sibling}return!1}function q(e){switch(e.tag){case 5:case 27:case 6:return e.stateNode;case 3:return e.stateNode.containerInfo;default:throw Error(c(559))}}var Y=null,ee=null;function le(e,t,l){return e===l?!0:e===t?(Y=e,!0):!1}function F(e,t,l){return e===l?(ee=e,!1):e===t?(ee!==null&&(Y=e),!0):!1}function J(e){if(e===null)return null;do e=e===null?null:e.return;while(e&&e.tag!==5&&e.tag!==27&&e.tag!==3);return e||null}function xe(e,t,l){for(var a=0,n=e;n;n=l(n))a++;n=0;for(var i=t;i;i=l(i))n++;for(;0<a-n;)e=l(e),a--;for(;0<n-a;)t=l(t),n--;for(;a--;){if(e===t||t!==null&&e===t.alternate)return e;e=l(e),t=l(t)}return null}var I=Object.assign,ie=Symbol.for("react.element"),He=Symbol.for("react.transitional.element"),Z=Symbol.for("react.portal"),Be=Symbol.for("react.fragment"),Ne=Symbol.for("react.strict_mode"),Ee=Symbol.for("react.profiler"),Fe=Symbol.for("react.consumer"),je=Symbol.for("react.context"),K=Symbol.for("react.forward_ref"),re=Symbol.for("react.suspense"),ue=Symbol.for("react.suspense_list"),ze=Symbol.for("react.memo"),ce=Symbol.for("react.lazy"),nt=Symbol.for("react.activity"),Q=Symbol.for("react.legacy_hidden"),fe=Symbol.for("react.memo_cache_sentinel"),h=Symbol.for("react.view_transition"),D=Symbol.for("react.recoverable"),C=Symbol.iterator;function G(e){return e===null||typeof e!="object"?null:(e=C&&e[C]||e["@@iterator"],typeof e=="function"?e:null)}var de=Symbol.for("react.client.reference");function se(e){if(e==null)return null;if(typeof e=="function")return e.$$typeof===de?null:e.displayName||e.name||null;if(typeof e=="string")return e;switch(e){case Be:return"Fragment";case Ee:return"Profiler";case Ne:return"StrictMode";case re:return"Suspense";case ue:return"SuspenseList";case nt:return"Activity";case h:return"ViewTransition"}if(typeof e=="object")switch(e.$$typeof){case Z:return"Portal";case je:return e.displayName||"Context";case Fe:return(e._context.displayName||"Context")+".Consumer";case K:var t=e.render;return e=e.displayName,e||(e=t.displayName||t.name||"",e=e!==""?"ForwardRef("+e+")":"ForwardRef"),e;case ze:return t=e.displayName||null,t!==null?t:se(e.type)||"Memo";case ce:t=e._payload,e=e._init;try{return se(e(t))}catch{}}return null}var Ae=Array.isArray,ae=o.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE,ne=m.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE,Me={pending:!1,data:null,method:null,action:null},Yt=[],wt=-1;function Ze(e){return{current:e}}function Ie(e){0>wt||(e.current=Yt[wt],Yt[wt]=null,wt--)}function De(e,t){wt++,Yt[wt]=e.current,e.current=t}var Ft=Ze(null),wl=Ze(null),It=Ze(null),jt=Ze(null);function vl(e,t){switch(De(It,t),De(wl,e),De(Ft,null),t.nodeType){case 9:case 11:e=(e=t.documentElement)&&(e=e.namespaceURI)?ch(e):0;break;default:if(e=t.tagName,t=t.namespaceURI)t=ch(t),e=oh(t,e);else switch(e){case"svg":e=1;break;case"math":e=2;break;default:e=0}}Ie(Ft),De(Ft,e)}function Ml(){Ie(Ft),Ie(wl),Ie(It)}function en(e){var t=e.memoizedState;t!==null&&(Zn._currentValue=t.memoizedState,De(jt,e)),t=Ft.current;var l=oh(t,e.type);t!==l&&(De(wl,e),De(Ft,l))}function Fl(e){wl.current===e&&(Ie(Ft),Ie(wl)),jt.current===e&&(Ie(jt),Zn._currentValue=Me)}var Il,Pn;function ol(e){if(Il===void 0)try{throw Error()}catch(l){var t=l.stack.trim().match(/\n( *(at )?)/);Il=t&&t[1]||"",Pn=-1<l.stack.indexOf(`
    at`)?" (<anonymous>)":-1<l.stack.indexOf("@")?"@unknown:0:0":""}return`
`+Il+e+Pn}var tn=!1;function Ea(e,t){if(!e||tn)return"";tn=!0;var l=Error.prepareStackTrace;Error.prepareStackTrace=void 0;try{var a={DetermineComponentFrameRoot:function(){try{if(t){var H=function(){throw Error()};if(Object.defineProperty(H.prototype,"props",{set:function(){throw Error()}}),typeof Reflect=="object"&&Reflect.construct){try{Reflect.construct(H,[])}catch($){var _=$}Reflect.construct(e,[],H)}else{try{H.call()}catch($){_=$}H=!1;try{var O=Object.getOwnPropertyDescriptor(e.prototype,"props");Object.defineProperty(e.prototype,"props",{configurable:!0,set:function(){throw Error()}}),H=!0,new e}finally{H&&(O!==void 0?Object.defineProperty(e.prototype,"props",O):delete e.prototype.props)}}}else{try{throw Error()}catch($){_=$}(H=e())&&typeof H.catch=="function"&&H.catch(function(){})}}catch($){if($&&_&&typeof $.stack=="string")return[$.stack,_.stack]}return[null,null]}};a.DetermineComponentFrameRoot.displayName="DetermineComponentFrameRoot";var n=Object.getOwnPropertyDescriptor(a.DetermineComponentFrameRoot,"name");n&&n.configurable&&Object.defineProperty(a.DetermineComponentFrameRoot,"name",{value:"DetermineComponentFrameRoot"});var i=a.DetermineComponentFrameRoot(),r=i[0],f=i[1];if(r&&f){var x=r.split(`
`),E=f.split(`
`);for(n=a=0;a<x.length&&!x[a].includes("DetermineComponentFrameRoot");)a++;for(;n<E.length&&!E[n].includes("DetermineComponentFrameRoot");)n++;if(a===x.length||n===E.length)for(a=x.length-1,n=E.length-1;1<=a&&0<=n&&x[a]!==E[n];)n--;for(;1<=a&&0<=n;a--,n--)if(x[a]!==E[n]){if(a!==1||n!==1)do if(a--,n--,0>n||x[a]!==E[n]){var w=`
`+x[a].replace(" at new "," at ");return e.displayName&&w.includes("<anonymous>")&&(w=w.replace("<anonymous>",e.displayName)),w}while(1<=a&&0<=n);break}}}finally{tn=!1,Error.prepareStackTrace=l}return(l=e?e.displayName||e.name:"")?ol(l):""}function tu(e,t){switch(e.tag){case 26:case 27:case 5:return ol(e.type);case 16:return ol("Lazy");case 13:return e.child!==t&&t!==null?ol("Suspense Fallback"):ol("Suspense");case 19:return ol("SuspenseList");case 0:case 15:return Ea(e.type,!1);case 11:return Ea(e.type.render,!1);case 1:return Ea(e.type,!0);case 31:return ol("Activity");case 30:return ol("ViewTransition");default:return""}}function ei(e){try{var t="",l=null;do t+=tu(e,l),l=e,e=e.return;while(e);return t}catch(a){return`
Error generating stack: `+a.message+`
`+a.stack}}var ln=Object.prototype.hasOwnProperty,an=s.unstable_scheduleCallback,Ta=s.unstable_cancelCallback,V=s.unstable_shouldYield,me=s.unstable_requestPaint,M=s.unstable_now,P=s.unstable_getCurrentPriorityLevel,X=s.unstable_ImmediatePriority,ve=s.unstable_UserBlockingPriority,Ue=s.unstable_NormalPriority,ye=s.unstable_LowPriority,he=s.unstable_IdlePriority,Wt=s.log,gt=s.unstable_setDisableYieldValue,Et=null,ft=null;function Ct(e){if(typeof Wt=="function"&&gt(e),ft&&typeof ft.setStrictMode=="function")try{ft.setStrictMode(Et,e)}catch{}}var it=Math.clz32?Math.clz32:li,nn=Math.log,ti=Math.LN2;function li(e){return e>>>=0,e===0?32:31-(nn(e)/ti|0)|0}var Ca=256,za=262144,Aa=4194304;function Ra(e){var t=e&42;if(t!==0)return t;switch(e&-e){case 1:return 1;case 2:return 2;case 4:return 4;case 8:return 8;case 16:return 16;case 32:return 32;case 64:return 64;case 128:return 128;case 256:case 512:case 1024:case 2048:case 4096:case 8192:case 16384:case 32768:case 65536:case 131072:return e&-e;case 262144:case 524288:case 1048576:case 2097152:return e&3932160;case 4194304:case 8388608:case 16777216:case 33554432:return e&62914560;case 67108864:return 67108864;case 134217728:return 134217728;case 268435456:return 268435456;case 536870912:return 536870912;case 1073741824:return 0;default:return e}}function lu(e,t,l){var a=e.pendingLanes;if(a===0)return 0;var n=0,i=e.suspendedLanes,r=e.pingedLanes;e=e.warmLanes;var f=a&134217727;return f!==0?(a=f&~i,a!==0?n=Ra(a):(r&=f,r!==0?n=Ra(r):l||(l=f&~e,l!==0&&(n=Ra(l))))):(f=a&~i,f!==0?n=Ra(f):r!==0?n=Ra(r):l||(l=a&~e,l!==0&&(n=Ra(l)))),n===0?0:t!==0&&t!==n&&!(t&i)&&(i=n&-n,l=t&-t,i>=l||i===32&&(l&4194048)!==0)?t:n}function ai(e,t){return(e.pendingLanes&~(e.suspendedLanes&~e.pingedLanes)&t)===0}function Do(e,t){t&8&&(t|=t&32);var l=e.entangledLanes;if(l!==0)for(e=e.entanglements,l&=t;0<l;){var a=31-it(l),n=1<<a;t|=e[a],l&=~n}return t}function Vp(e,t){switch(e){case 1:case 2:case 4:case 8:case 64:return t+250;case 16:case 32:case 128:case 256:case 512:case 1024:case 2048:case 4096:case 8192:case 16384:case 32768:case 65536:case 131072:case 262144:case 524288:case 1048576:case 2097152:return t+5e3;case 4194304:case 8388608:case 16777216:case 33554432:return-1;case 67108864:case 134217728:case 268435456:case 536870912:case 1073741824:return-1;default:return-1}}function Uo(){var e=Aa;return Aa<<=1,!(Aa&62914560)&&(Aa=4194304),e}function Us(e){for(var t=[],l=0;31>l;l++)t.push(e);return t}function ni(e,t){e.pendingLanes|=t,t!==268435456&&(e.suspendedLanes=0,e.pingedLanes=0,e.warmLanes=0)}function Zp(e,t,l,a,n,i){var r=e.pendingLanes;e.pendingLanes=l,e.suspendedLanes=0,e.pingedLanes=0,e.warmLanes=0,e.expiredLanes&=l,e.entangledLanes&=l,e.errorRecoveryDisabledLanes&=l,e.shellSuspendCounter=0;var f=e.entanglements,x=e.expirationTimes,E=e.hiddenUpdates;for(l=r&~l;0<l;){var w=31-it(l),H=1<<w;f[w]=0,x[w]=-1;var _=E[w];if(_!==null)for(E[w]=null,w=0;w<_.length;w++){var O=_[w];O!==null&&(O.lane&=-536870913)}l&=~H}a!==0&&Lo(e,a,0),i!==0&&n===0&&e.tag!==0&&(e.suspendedLanes|=i&~(r&~t))}function Lo(e,t,l){e.pendingLanes|=t,e.suspendedLanes&=~t;var a=31-it(t);e.entangledLanes|=t,e.entanglements[a]=e.entanglements[a]|1073741824|l&261930}function Ho(e,t){var l=e.entangledLanes|=t;for(e=e.entanglements;l;){var a=31-it(l),n=1<<a;n&t|e[a]&t&&(e[a]|=t),l&=~n}}function Bo(e,t){var l=t&-t;return l=l&42?1:Ls(l),l&(e.suspendedLanes|t)?0:l}function Ls(e){switch(e){case 2:e=1;break;case 8:e=4;break;case 32:e=16;break;case 256:case 512:case 1024:case 2048:case 4096:case 8192:case 16384:case 32768:case 65536:case 131072:case 262144:case 524288:case 1048576:case 2097152:case 4194304:case 8388608:case 16777216:case 33554432:e=128;break;case 268435456:e=134217728;break;default:e=0}return e}function Hs(e){return e&=-e,2<e?8<e?e&134217727?32:268435456:8:2}function qo(){var e=ne.p;return e!==0?e:(e=window.event,e===void 0?32:Kh(e.type))}function Yo(e,t){var l=ne.p;try{return ne.p=e,t()}finally{ne.p=l}}var Dl=Math.random().toString(36).slice(2),xt="__reactFiber$"+Dl,Mt="__reactProps$"+Dl,un="__reactContainer$"+Dl,Go="__reactEvents$"+Dl,Kp="__reactListeners$"+Dl,Jp="__reactHandles$"+Dl,ko="__reactResources$"+Dl,ii="__reactMarker$"+Dl,au="__reactLoad$"+Dl;function nu(e){delete e[xt],delete e[Mt],delete e[Kp],delete e[Jp]}function Oa(e){var t;if(t=e[xt])return t;for(var l=e.parentNode;l;){if(t=l[un]||l[xt]){if(l=t.alternate,t.child!==null||l!==null&&l.child!==null)for(e=Ch(e);e!==null;){if(l=e[xt])return l;e=Ch(e)}return t}e=l,l=e.parentNode}return null}function sn(e){if(e=e[xt]||e[un]){var t=e.tag;if(t===5||t===6||t===13||t===31||t===26||t===27||t===3)return e}return null}function ui(e){var t=e.tag;if(t===5||t===26||t===27||t===6)return e.stateNode;throw Error(c(33))}function rn(e){var t=e[ko];return t||(t=e[ko]={hoistableStyles:new Map,hoistableScripts:new Map}),t}function dt(e){e[ii]=!0}function Qo(e){e[au]=void 0}var Xo=new Set,Vo={};function wa(e,t){cn(e,t),cn(e+"Capture",t)}function cn(e,t){for(Vo[e]=t,e=0;e<t.length;e++)Xo.add(t[e])}var $p=RegExp("^[:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD][:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD\\-.0-9\\u00B7\\u0300-\\u036F\\u203F-\\u2040]*$"),Zo={},Ko={};function Fp(e){return ln.call(Ko,e)?!0:ln.call(Zo,e)?!1:$p.test(e)?Ko[e]=!0:(Zo[e]=!0,!1)}var Le=!1;function Jo(){var e=Le;return Le=!1,e}function iu(e,t,l){if(Fp(t))if(l===null)e.removeAttribute(t);else{switch(typeof l){case"undefined":case"function":case"symbol":e.removeAttribute(t);return;case"boolean":var a=t.toLowerCase().slice(0,5);if(a!=="data-"&&a!=="aria-"){e.removeAttribute(t);return}}e.setAttribute(t,l)}}function uu(e,t,l){if(l===null)e.removeAttribute(t);else{switch(typeof l){case"undefined":case"function":case"symbol":case"boolean":e.removeAttribute(t);return}e.setAttribute(t,l)}}function Ul(e,t,l,a){if(a===null)e.removeAttribute(l);else{switch(typeof a){case"undefined":case"function":case"symbol":case"boolean":e.removeAttribute(l);return}e.setAttributeNS(t,l,a)}}function Gt(e){switch(typeof e){case"bigint":case"boolean":case"number":case"string":case"undefined":return e;case"object":return e;default:return""}}function $o(e){var t=e.type;return(e=e.nodeName)&&e.toLowerCase()==="input"&&(t==="checkbox"||t==="radio")}function Ip(e,t,l){var a=Object.getOwnPropertyDescriptor(e.constructor.prototype,t);if(!e.hasOwnProperty(t)&&typeof a<"u"&&typeof a.get=="function"&&typeof a.set=="function"){var n=a.get,i=a.set;return Object.defineProperty(e,t,{configurable:!0,get:function(){return n.call(this)},set:function(r){l=""+r,i.call(this,r)}}),Object.defineProperty(e,t,{enumerable:a.enumerable}),{getValue:function(){return l},setValue:function(r){l=""+r},stopTracking:function(){e._valueTracker=null,delete e[t]}}}}function Bs(e){if(!e._valueTracker){var t=$o(e)?"checked":"value";e._valueTracker=Ip(e,t,""+e[t])}}function Fo(e){if(!e)return!1;var t=e._valueTracker;if(!t)return!0;var l=t.getValue(),a="";return e&&(a=$o(e)?e.checked?"true":"false":e.value),e=a,e!==l?(t.setValue(e),!0):!1}var Wp=/[\n"\\]/g;function Pt(e){return e.replace(Wp,function(t){return"\\"+t.charCodeAt(0).toString(16)+" "})}function qs(e,t,l,a,n,i,r,f){e.name="",r!=null&&typeof r!="function"&&typeof r!="symbol"&&typeof r!="boolean"?e.type=r:e.removeAttribute("type"),t!=null?r==="number"?(t===0&&e.value===""||e.value!=t)&&(e.value=""+Gt(t)):e.value!==""+Gt(t)&&(e.value=""+Gt(t)):r!=="submit"&&r!=="reset"||e.removeAttribute("value"),t!=null?r==="number"&&e.value==t?Ys(e,Gt(e.value)):Ys(e,Gt(t)):l!=null?Ys(e,Gt(l)):a!=null&&e.removeAttribute("value"),n==null&&i!=null&&(e.defaultChecked=!!i),n!=null&&(e.checked=n&&typeof n!="function"&&typeof n!="symbol"),f!=null&&typeof f!="function"&&typeof f!="symbol"&&typeof f!="boolean"?e.name=""+Gt(f):e.removeAttribute("name")}function Io(e,t,l,a,n,i,r,f){if(i!=null&&typeof i!="function"&&typeof i!="symbol"&&typeof i!="boolean"&&(e.type=i),t!=null||l!=null){if(!(i!=="submit"&&i!=="reset"||t!=null)){Bs(e);return}l=l!=null?""+Gt(l):"",t=t!=null?""+Gt(t):l,f||t===e.value||(e.value=t),e.defaultValue=t}a=a??n,a=typeof a!="function"&&typeof a!="symbol"&&!!a,e.checked=f?e.checked:!!a,e.defaultChecked=!!a,r!=null&&typeof r!="function"&&typeof r!="symbol"&&typeof r!="boolean"&&(e.name=r),Bs(e)}function Ys(e,t){e.defaultValue!==""+t&&(e.defaultValue=""+t)}function on(e,t,l,a){if(e=e.options,t){t={};for(var n=0;n<l.length;n++)t["$"+l[n]]=!0;for(l=0;l<e.length;l++)n=t.hasOwnProperty("$"+e[l].value),e[l].selected!==n&&(e[l].selected=n),n&&a&&(e[l].defaultSelected=!0)}else{for(l=""+Gt(l),t=null,n=0;n<e.length;n++){if(e[n].value===l){e[n].selected=!0,a&&(e[n].defaultSelected=!0);return}t!==null||e[n].disabled||(t=e[n])}t!==null&&(t.selected=!0)}}function Wo(e,t,l){if(t!=null&&(t=""+Gt(t),t!==e.value&&(e.value=t),l==null)){e.defaultValue!==t&&(e.defaultValue=t);return}e.defaultValue=l!=null?""+Gt(l):""}function Po(e,t,l,a){if(t==null){if(a!=null){if(l!=null)throw Error(c(92));if(Ae(a)){if(1<a.length)throw Error(c(93));a=a[0]}l=a}l==null&&(l=""),t=l}l=Gt(t),e.defaultValue=l,a=e.textContent,a===l&&a!==""&&a!==null&&(e.value=a),Bs(e)}function fn(e,t){if(t){var l=e.firstChild;if(l&&l===e.lastChild&&l.nodeType===3){l.nodeValue=t;return}}e.textContent=t}var Pp=new Set("animationIterationCount aspectRatio borderImageOutset borderImageSlice borderImageWidth boxFlex boxFlexGroup boxOrdinalGroup columnCount columns flex flexGrow flexPositive flexShrink flexNegative flexOrder gridArea gridRow gridRowEnd gridRowSpan gridRowStart gridColumn gridColumnEnd gridColumnSpan gridColumnStart fontWeight lineClamp lineHeight opacity order orphans scale tabSize widows zIndex zoom fillOpacity floodOpacity stopOpacity strokeDasharray strokeDashoffset strokeMiterlimit strokeOpacity strokeWidth MozAnimationIterationCount MozBoxFlex MozBoxFlexGroup MozLineClamp msAnimationIterationCount msFlex msZoom msFlexGrow msFlexNegative msFlexOrder msFlexPositive msFlexShrink msGridColumn msGridColumnSpan msGridRow msGridRowSpan WebkitAnimationIterationCount WebkitBoxFlex WebKitBoxFlexGroup WebkitBoxOrdinalGroup WebkitColumnCount WebkitColumns WebkitFlex WebkitFlexGrow WebkitFlexPositive WebkitFlexShrink WebkitLineClamp".split(" "));function ef(e,t,l){var a=t.indexOf("--")===0;l==null||typeof l=="boolean"||l===""?a?e.setProperty(t,""):t==="float"?e.cssFloat="":e[t]="":a?e.setProperty(t,l):typeof l!="number"||l===0||Pp.has(t)?t==="float"?e.cssFloat=l:e[t]=(""+l).trim():e[t]=l+"px"}function tf(e,t,l){if(t!=null&&typeof t!="object")throw Error(c(62));if(e=e.style,l!=null){for(var a in l)!l.hasOwnProperty(a)||t!=null&&t.hasOwnProperty(a)||(a.indexOf("--")===0?e.setProperty(a,""):a==="float"?e.cssFloat="":e[a]="",Le=!0);for(var n in t)a=t[n],t.hasOwnProperty(n)&&l[n]!==a&&(ef(e,n,a),Le=!0)}else for(var i in t)t.hasOwnProperty(i)&&ef(e,i,t[i])}function Gs(e){if(e.indexOf("-")===-1)return!1;switch(e){case"annotation-xml":case"color-profile":case"font-face":case"font-face-src":case"font-face-uri":case"font-face-format":case"font-face-name":case"missing-glyph":return!1;default:return!0}}var eg=new Map([["acceptCharset","accept-charset"],["htmlFor","for"],["httpEquiv","http-equiv"],["crossOrigin","crossorigin"],["accentHeight","accent-height"],["alignmentBaseline","alignment-baseline"],["arabicForm","arabic-form"],["baselineShift","baseline-shift"],["capHeight","cap-height"],["clipPath","clip-path"],["clipRule","clip-rule"],["colorInterpolation","color-interpolation"],["colorInterpolationFilters","color-interpolation-filters"],["colorProfile","color-profile"],["colorRendering","color-rendering"],["dominantBaseline","dominant-baseline"],["enableBackground","enable-background"],["fillOpacity","fill-opacity"],["fillRule","fill-rule"],["floodColor","flood-color"],["floodOpacity","flood-opacity"],["fontFamily","font-family"],["fontSize","font-size"],["fontSizeAdjust","font-size-adjust"],["fontStretch","font-stretch"],["fontStyle","font-style"],["fontVariant","font-variant"],["fontWeight","font-weight"],["glyphName","glyph-name"],["glyphOrientationHorizontal","glyph-orientation-horizontal"],["glyphOrientationVertical","glyph-orientation-vertical"],["horizAdvX","horiz-adv-x"],["horizOriginX","horiz-origin-x"],["imageRendering","image-rendering"],["letterSpacing","letter-spacing"],["lightingColor","lighting-color"],["markerEnd","marker-end"],["markerMid","marker-mid"],["markerStart","marker-start"],["maskType","mask-type"],["overlinePosition","overline-position"],["overlineThickness","overline-thickness"],["paintOrder","paint-order"],["panose-1","panose-1"],["pointerEvents","pointer-events"],["renderingIntent","rendering-intent"],["shapeRendering","shape-rendering"],["stopColor","stop-color"],["stopOpacity","stop-opacity"],["strikethroughPosition","strikethrough-position"],["strikethroughThickness","strikethrough-thickness"],["strokeDasharray","stroke-dasharray"],["strokeDashoffset","stroke-dashoffset"],["strokeLinecap","stroke-linecap"],["strokeLinejoin","stroke-linejoin"],["strokeMiterlimit","stroke-miterlimit"],["strokeOpacity","stroke-opacity"],["strokeWidth","stroke-width"],["textAnchor","text-anchor"],["textDecoration","text-decoration"],["textRendering","text-rendering"],["transformOrigin","transform-origin"],["underlinePosition","underline-position"],["underlineThickness","underline-thickness"],["unicodeBidi","unicode-bidi"],["unicodeRange","unicode-range"],["unitsPerEm","units-per-em"],["vAlphabetic","v-alphabetic"],["vHanging","v-hanging"],["vIdeographic","v-ideographic"],["vMathematical","v-mathematical"],["vectorEffect","vector-effect"],["vertAdvY","vert-adv-y"],["vertOriginX","vert-origin-x"],["vertOriginY","vert-origin-y"],["wordSpacing","word-spacing"],["writingMode","writing-mode"],["xmlnsXlink","xmlns:xlink"],["xHeight","x-height"]]),tg=/^[\u0000-\u001F ]*j[\r\n\t]*a[\r\n\t]*v[\r\n\t]*a[\r\n\t]*s[\r\n\t]*c[\r\n\t]*r[\r\n\t]*i[\r\n\t]*p[\r\n\t]*t[\r\n\t]*:/i;function su(e){return tg.test(""+e)?"javascript:throw new Error('React has blocked a javascript: URL as a security precaution.')":e}function yl(){}var ks=null;function Qs(e){return e=e.target||e.srcElement||window,e.correspondingUseElement&&(e=e.correspondingUseElement),e.nodeType===3?e.parentNode:e}var dn=null,mn=null;function lf(e){var t=sn(e);if(t&&(e=t.stateNode)){var l=e[Mt]||null;e:switch(e=t.stateNode,t.type){case"input":if(qs(e,l.value,l.defaultValue,l.defaultValue,l.checked,l.defaultChecked,l.type,l.name),t=l.name,l.type==="radio"&&t!=null){for(l=e;l.parentNode;)l=l.parentNode;for(l=l.querySelectorAll('input[name="'+Pt(""+t)+'"][type="radio"]'),t=0;t<l.length;t++){var a=l[t];if(a!==e&&a.form===e.form){var n=a[Mt]||null;if(!n)throw Error(c(90));qs(a,n.value,n.defaultValue,n.defaultValue,n.checked,n.defaultChecked,n.type,n.name)}}for(t=0;t<l.length;t++)a=l[t],a.form===e.form&&Fo(a)}break e;case"textarea":Wo(e,l.value,l.defaultValue);break e;case"select":t=l.value,t!=null&&on(e,!!l.multiple,t,!1)}}}var Xs=!1;function af(e,t,l){if(Xs)return e(t,l);Xs=!0;try{var a=e(t);return a}finally{if(Xs=!1,(dn!==null||mn!==null)&&(ss(),dn&&(t=dn,e=mn,mn=dn=null,lf(t),e)))for(t=0;t<e.length;t++)lf(e[t])}}function si(e,t){var l=e.stateNode;if(l===null)return null;var a=l[Mt]||null;if(a===null)return null;l=a[t];e:switch(t){case"onClick":case"onClickCapture":case"onDoubleClick":case"onDoubleClickCapture":case"onMouseDown":case"onMouseDownCapture":case"onMouseMove":case"onMouseMoveCapture":case"onMouseUp":case"onMouseUpCapture":case"onMouseEnter":(a=!a.disabled)||(e=e.type,a=!(e==="button"||e==="input"||e==="select"||e==="textarea")),e=!a;break e;default:e=!1}if(e)return null;if(l&&typeof l!="function")throw Error(c(231,t,typeof l));return l}var Ll=!(typeof window>"u"||typeof window.document>"u"||typeof window.document.createElement>"u"),Vs=!1;if(Ll)try{var ri={};Object.defineProperty(ri,"passive",{get:function(){Vs=!0}}),window.addEventListener("test",ri,ri),window.removeEventListener("test",ri,ri)}catch{Vs=!1}var Wl=null,Zs=null,ru=null;function nf(){if(ru)return ru;var e,t=Zs,l=t.length,a,n="value"in Wl?Wl.value:Wl.textContent,i=n.length;for(e=0;e<l&&t[e]===n[e];e++);var r=l-e;for(a=1;a<=r&&t[l-a]===n[i-a];a++);return ru=n.slice(e,1<a?1-a:void 0)}function cu(e){var t=e.keyCode;return"charCode"in e?(e=e.charCode,e===0&&t===13&&(e=13)):e=t,e===10&&(e=13),32<=e||e===13?e:0}function ou(){return!0}function uf(){return!1}function zt(e){function t(l,a,n,i,r){this._reactName=l,this._targetInst=n,this.type=a,this.nativeEvent=i,this.target=r,this.currentTarget=null;for(var f in e)e.hasOwnProperty(f)&&(l=e[f],this[f]=l?l(i):i[f]);return this.isDefaultPrevented=(i.defaultPrevented!=null?i.defaultPrevented:i.returnValue===!1)?ou:uf,this.isPropagationStopped=uf,this}return I(t.prototype,{preventDefault:function(){this.defaultPrevented=!0;var l=this.nativeEvent;l&&(l.preventDefault?l.preventDefault():typeof l.returnValue!="unknown"&&(l.returnValue=!1),this.isDefaultPrevented=ou)},stopPropagation:function(){var l=this.nativeEvent;l&&(l.stopPropagation?l.stopPropagation():typeof l.cancelBubble!="unknown"&&(l.cancelBubble=!0),this.isPropagationStopped=ou)},persist:function(){},isPersistent:ou}),t}var Pl={eventPhase:0,bubbles:0,cancelable:0,timeStamp:function(e){return e.timeStamp||Date.now()},defaultPrevented:0,isTrusted:0},fu=zt(Pl),ci=I({},Pl,{view:0,detail:0}),lg=zt(ci),Ks,Js,oi,du=I({},ci,{screenX:0,screenY:0,clientX:0,clientY:0,pageX:0,pageY:0,ctrlKey:0,shiftKey:0,altKey:0,metaKey:0,getModifierState:Fs,button:0,buttons:0,relatedTarget:function(e){return e.relatedTarget===void 0?e.fromElement===e.srcElement?e.toElement:e.fromElement:e.relatedTarget},movementX:function(e){return"movementX"in e?e.movementX:(e!==oi&&(oi&&e.type==="mousemove"?(Ks=e.screenX-oi.screenX,Js=e.screenY-oi.screenY):Js=Ks=0,oi=e),Ks)},movementY:function(e){return"movementY"in e?e.movementY:Js}}),sf=zt(du),ag=I({},du,{dataTransfer:0}),ng=zt(ag),ig=I({},ci,{relatedTarget:0}),$s=zt(ig),ug=I({},Pl,{animationName:0,elapsedTime:0,pseudoElement:0}),sg=zt(ug),rg=I({},Pl,{clipboardData:function(e){return"clipboardData"in e?e.clipboardData:window.clipboardData}}),cg=zt(rg),og=I({},Pl,{data:0}),rf=zt(og),fg={Esc:"Escape",Spacebar:" ",Left:"ArrowLeft",Up:"ArrowUp",Right:"ArrowRight",Down:"ArrowDown",Del:"Delete",Win:"OS",Menu:"ContextMenu",Apps:"ContextMenu",Scroll:"ScrollLock",MozPrintableKey:"Unidentified"},dg={8:"Backspace",9:"Tab",12:"Clear",13:"Enter",16:"Shift",17:"Control",18:"Alt",19:"Pause",20:"CapsLock",27:"Escape",32:" ",33:"PageUp",34:"PageDown",35:"End",36:"Home",37:"ArrowLeft",38:"ArrowUp",39:"ArrowRight",40:"ArrowDown",45:"Insert",46:"Delete",112:"F1",113:"F2",114:"F3",115:"F4",116:"F5",117:"F6",118:"F7",119:"F8",120:"F9",121:"F10",122:"F11",123:"F12",144:"NumLock",145:"ScrollLock",224:"Meta"},mg={Alt:"altKey",Control:"ctrlKey",Meta:"metaKey",Shift:"shiftKey"};function hg(e){var t=this.nativeEvent;return t.getModifierState?t.getModifierState(e):(e=mg[e])?!!t[e]:!1}function Fs(){return hg}var pg=I({},ci,{key:function(e){if(e.key){var t=fg[e.key]||e.key;if(t!=="Unidentified")return t}return e.type==="keypress"?(e=cu(e),e===13?"Enter":String.fromCharCode(e)):e.type==="keydown"||e.type==="keyup"?dg[e.keyCode]||"Unidentified":""},code:0,location:0,ctrlKey:0,shiftKey:0,altKey:0,metaKey:0,repeat:0,locale:0,getModifierState:Fs,charCode:function(e){return e.type==="keypress"?cu(e):0},keyCode:function(e){return e.type==="keydown"||e.type==="keyup"?e.keyCode:0},which:function(e){return e.type==="keypress"?cu(e):e.type==="keydown"||e.type==="keyup"?e.keyCode:0}}),gg=zt(pg),xg=I({},du,{pointerId:0,width:0,height:0,pressure:0,tangentialPressure:0,tiltX:0,tiltY:0,twist:0,pointerType:0,isPrimary:0}),cf=zt(xg),vg=I({},Pl,{submitter:0}),yg=zt(vg),bg=I({},ci,{touches:0,targetTouches:0,changedTouches:0,altKey:0,metaKey:0,ctrlKey:0,shiftKey:0,getModifierState:Fs}),Sg=zt(bg),Ng=I({},Pl,{propertyName:0,elapsedTime:0,pseudoElement:0}),_g=zt(Ng),jg=I({},du,{deltaX:function(e){return"deltaX"in e?e.deltaX:"wheelDeltaX"in e?-e.wheelDeltaX:0},deltaY:function(e){return"deltaY"in e?e.deltaY:"wheelDeltaY"in e?-e.wheelDeltaY:"wheelDelta"in e?-e.wheelDelta:0},deltaZ:0,deltaMode:0}),Eg=zt(jg),Tg=I({},Pl,{newState:0,oldState:0,source:0}),Cg=zt(Tg),zg=[9,13,27,32],Is=Ll&&"CompositionEvent"in window,fi=null;Ll&&"documentMode"in document&&(fi=document.documentMode);var Ag=Ll&&"TextEvent"in window&&!fi,of=Ll&&(!Is||fi&&8<fi&&11>=fi),ff=" ",df=!1;function mf(e,t){switch(e){case"keyup":return zg.indexOf(t.keyCode)!==-1;case"keydown":return t.keyCode!==229;case"keypress":case"mousedown":case"focusout":return!0;default:return!1}}function hf(e){return e=e.detail,typeof e=="object"&&"data"in e?e.data:null}var hn=!1;function Rg(e,t){switch(e){case"compositionend":return hf(t);case"keypress":return t.which!==32?null:(df=!0,ff);case"textInput":return e=t.data,e===ff&&df?null:e;default:return null}}function Og(e,t){if(hn)return e==="compositionend"||!Is&&mf(e,t)?(e=nf(),ru=Zs=Wl=null,hn=!1,e):null;switch(e){case"paste":return null;case"keypress":if(!(t.ctrlKey||t.altKey||t.metaKey)||t.ctrlKey&&t.altKey){if(t.char&&1<t.char.length)return t.char;if(t.which)return String.fromCharCode(t.which)}return null;case"compositionend":return of&&t.locale!=="ko"?null:t.data;default:return null}}var wg={color:!0,date:!0,datetime:!0,"datetime-local":!0,email:!0,month:!0,number:!0,password:!0,range:!0,search:!0,tel:!0,text:!0,time:!0,url:!0,week:!0};function pf(e){var t=e&&e.nodeName&&e.nodeName.toLowerCase();return t==="input"?!!wg[e.type]:t==="textarea"}function gf(e,t,l,a){dn?mn?mn.push(a):mn=[a]:dn=a,t=ms(t,"onChange"),0<t.length&&(l=new fu("onChange","change",null,l,a),e.push({event:l,listeners:t}))}var di=null,mi=null;function Mg(e){ah(e,0)}function mu(e){var t=ui(e);if(Fo(t))return e}function xf(e,t){if(e==="change")return t}var vf=!1;if(Ll){var Ws;if(Ll){var Ps="oninput"in document;if(!Ps){var yf=document.createElement("div");yf.setAttribute("oninput","return;"),Ps=typeof yf.oninput=="function"}Ws=Ps}else Ws=!1;vf=Ws&&(!document.documentMode||9<document.documentMode)}function bf(){di&&(di.detachEvent("onpropertychange",Sf),mi=di=null)}function Sf(e){if(e.propertyName==="value"&&mu(mi)){var t=[];gf(t,mi,e,Qs(e)),af(Mg,t)}}function Dg(e,t,l){e==="focusin"?(bf(),di=t,mi=l,di.attachEvent("onpropertychange",Sf)):e==="focusout"&&bf()}function Ug(e){if(e==="selectionchange"||e==="keyup"||e==="keydown")return mu(mi)}function Lg(e,t){if(e==="click")return mu(t)}function Hg(e,t){if(e==="input"||e==="change")return mu(t)}function Bg(e,t){return e===t&&(e!==0||1/e===1/t)||e!==e&&t!==t}var kt=typeof Object.is=="function"?Object.is:Bg;function hi(e,t){if(kt(e,t))return!0;if(typeof e!="object"||e===null||typeof t!="object"||t===null)return!1;var l=Object.keys(e),a=Object.keys(t);if(l.length!==a.length)return!1;for(a=0;a<l.length;a++){var n=l[a];if(!ln.call(t,n)||!kt(e[n],t[n]))return!1}return!0}function er(e){if(e=e||(typeof document<"u"?document:void 0),typeof e>"u")return null;try{return e.activeElement||e.body}catch{return e.body}}function Nf(e){for(;e&&e.firstChild;)e=e.firstChild;return e}function _f(e,t){var l=Nf(e);e=0;for(var a;l;){if(l.nodeType===3){if(a=e+l.textContent.length,e<=t&&a>=t)return{node:l,offset:t-e};e=a}e:{for(;l;){if(l.nextSibling){l=l.nextSibling;break e}l=l.parentNode}l=void 0}l=Nf(l)}}function jf(e,t){return e&&t?e===t?!0:e&&e.nodeType===3?!1:t&&t.nodeType===3?jf(e,t.parentNode):"contains"in e?e.contains(t):e.compareDocumentPosition?!!(e.compareDocumentPosition(t)&16):!1:!1}function Ef(e){e=e!=null&&e.ownerDocument!=null&&e.ownerDocument.defaultView!=null?e.ownerDocument.defaultView:window;for(var t=er(e.document);t instanceof e.HTMLIFrameElement;){try{var l=typeof t.contentWindow.location.href=="string"}catch{l=!1}if(l)e=t.contentWindow;else break;t=er(e.document)}return t}function tr(e){var t=e&&e.nodeName&&e.nodeName.toLowerCase();return t&&(t==="input"&&(e.type==="text"||e.type==="search"||e.type==="tel"||e.type==="url"||e.type==="password")||t==="textarea"||e.contentEditable==="true")}var qg=Ll&&"documentMode"in document&&11>=document.documentMode,pn=null,lr=null,pi=null,ar=!1;function Tf(e,t,l){var a=l.window===l?l.document:l.nodeType===9?l:l.ownerDocument;ar||pn==null||pn!==er(a)||(a=pn,"selectionStart"in a&&tr(a)?a={start:a.selectionStart,end:a.selectionEnd}:(a=(a.ownerDocument&&a.ownerDocument.defaultView||window).getSelection(),a={anchorNode:a.anchorNode,anchorOffset:a.anchorOffset,focusNode:a.focusNode,focusOffset:a.focusOffset}),pi&&hi(pi,a)||(pi=a,a=ms(lr,"onSelect"),0<a.length&&(t=new fu("onSelect","select",null,t,l),e.push({event:t,listeners:a}),t.target=pn)))}function Ma(e,t){var l={};return l[e.toLowerCase()]=t.toLowerCase(),l["Webkit"+e]="webkit"+t,l["Moz"+e]="moz"+t,l}var gn={animationend:Ma("Animation","AnimationEnd"),animationiteration:Ma("Animation","AnimationIteration"),animationstart:Ma("Animation","AnimationStart"),transitionrun:Ma("Transition","TransitionRun"),transitionstart:Ma("Transition","TransitionStart"),transitioncancel:Ma("Transition","TransitionCancel"),transitionend:Ma("Transition","TransitionEnd")},nr={},Cf={};Ll&&(Cf=document.createElement("div").style,"AnimationEvent"in window||(delete gn.animationend.animation,delete gn.animationiteration.animation,delete gn.animationstart.animation),"TransitionEvent"in window||delete gn.transitionend.transition);function Da(e){if(nr[e])return nr[e];if(!gn[e])return e;var t=gn[e],l;for(l in t)if(t.hasOwnProperty(l)&&l in Cf)return nr[e]=t[l];return e}var zf=Da("animationend"),Af=Da("animationiteration"),Rf=Da("animationstart"),Yg=Da("transitionrun"),Gg=Da("transitionstart"),kg=Da("transitioncancel"),Of=Da("transitionend"),wf=new Map,ir="abort auxClick beforeToggle cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error fullscreenChange fullscreenError gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll toggle touchMove waiting wheel".split(" ");ir.push("scrollEnd");function fl(e,t){wf.set(e,t),wa(t,[e])}var Qg=0;function Hl(e,t){if(e.name!=null&&e.name!=="auto")return e.name;if(t.autoName!==null)return t.autoName;e=pl.identifierPrefix;var l=Qg++;return e="_"+e+"t_"+l.toString(32)+"_",t.autoName=e}function Mf(e){if(e==null||typeof e=="string")return e;var t=null,l=Ln;if(l!==null)for(var a=0;a<l.length;a++){var n=e[l[a]];if(n!=null){if(n==="none")return"none";t=t==null?n:t+(" "+n)}}return t??e.default}function Bl(e,t){return e=Mf(e),t=Mf(t),t==null?e==="auto"?null:e:t==="auto"?null:t}var hu=typeof reportError=="function"?reportError:function(e){if(typeof window=="object"&&typeof window.ErrorEvent=="function"){var t=new window.ErrorEvent("error",{bubbles:!0,cancelable:!0,message:typeof e=="object"&&e!==null&&typeof e.message=="string"?String(e.message):String(e),error:e});if(!window.dispatchEvent(t))return}else if(typeof process=="object"&&typeof process.emit=="function"){process.emit("uncaughtException",e);return}console.error(e)},el=[],xn=0,ur=0;function pu(){for(var e=xn,t=ur=xn=0;t<e;){var l=el[t];el[t++]=null;var a=el[t];el[t++]=null;var n=el[t];el[t++]=null;var i=el[t];if(el[t++]=null,a!==null&&n!==null){var r=a.pending;r===null?n.next=n:(n.next=r.next,r.next=n),a.pending=n}i!==0&&Df(l,n,i)}}function gu(e,t,l,a){el[xn++]=e,el[xn++]=t,el[xn++]=l,el[xn++]=a,ur|=a,e.lanes|=a,e=e.alternate,e!==null&&(e.lanes|=a)}function sr(e,t,l,a){return gu(e,t,l,a),xu(e)}function Ua(e,t){return gu(e,null,null,t),xu(e)}function Df(e,t,l){e.lanes|=l;var a=e.alternate;a!==null&&(a.lanes|=l);for(var n=!1,i=e.return;i!==null;)i.childLanes|=l,a=i.alternate,a!==null&&(a.childLanes|=l),i.tag===22&&(e=i.stateNode,e===null||e._visibility&1||(n=!0)),e=i,i=i.return;return e.tag===3?(i=e.stateNode,n&&t!==null&&(n=31-it(l),e=i.hiddenUpdates,a=e[n],a===null?e[n]=[t]:a.push(t),t.lane=l|536870912),i):null}function xu(e){if(50<Hi)throw Hi=0,us=null,Error(c(185));for(var t=e.return;t!==null;)e=t,t=e.return;return e.tag===3?e.stateNode:null}var vn={};function Xg(e,t,l,a){this.tag=e,this.key=l,this.sibling=this.child=this.return=this.stateNode=this.type=this.elementType=null,this.index=0,this.refCleanup=this.ref=null,this.pendingProps=t,this.dependencies=this.memoizedState=this.updateQueue=this.memoizedProps=null,this.mode=a,this.subtreeFlags=this.flags=0,this.deletions=null,this.childLanes=this.lanes=0,this.alternate=null}function Dt(e,t,l,a){return new Xg(e,t,l,a)}function rr(e){return e=e.prototype,!(!e||!e.isReactComponent)}function ql(e,t){var l=e.alternate;return l===null?(l=Dt(e.tag,t,e.key,e.mode),l.elementType=e.elementType,l.type=e.type,l.stateNode=e.stateNode,l.alternate=e,e.alternate=l):(l.pendingProps=t,l.type=e.type,l.flags=0,l.subtreeFlags=0,l.deletions=null),l.flags=e.flags&1206910976,l.childLanes=e.childLanes,l.lanes=e.lanes,l.child=e.child,l.memoizedProps=e.memoizedProps,l.memoizedState=e.memoizedState,l.updateQueue=e.updateQueue,t=e.dependencies,l.dependencies=t===null?null:{lanes:t.lanes,firstContext:t.firstContext},l.sibling=e.sibling,l.index=e.index,l.ref=e.ref,l.refCleanup=e.refCleanup,l}function Uf(e,t){e.flags&=1206910978;var l=e.alternate;return l===null?(e.childLanes=0,e.lanes=t,e.child=null,e.subtreeFlags=0,e.memoizedProps=null,e.memoizedState=null,e.updateQueue=null,e.dependencies=null,e.stateNode=null):(e.childLanes=l.childLanes,e.lanes=l.lanes,e.child=l.child,e.subtreeFlags=0,e.deletions=null,e.memoizedProps=l.memoizedProps,e.memoizedState=l.memoizedState,e.updateQueue=l.updateQueue,e.type=l.type,t=l.dependencies,e.dependencies=t===null?null:{lanes:t.lanes,firstContext:t.firstContext}),e}function vu(e,t,l,a,n,i){var r=0;if(a=e,typeof a=="function")rr(a)&&(r=1);else if(typeof a=="string")r=vv(e,l,Ft.current)?26:e==="html"||e==="head"||e==="body"?27:5;else e:switch(a){case nt:return e=Dt(31,l,t,n),e.elementType=nt,e.lanes=i,e;case Be:return La(l.children,n,i,t);case Ne:r=8,n|=24;break;case Ee:return e=Dt(12,l,t,n|2),e.elementType=Ee,e.lanes=i,e;case re:return e=Dt(13,l,t,n),e.elementType=re,e.lanes=i,e;case ue:return e=Dt(19,l,t,n),e.elementType=ue,e.lanes=i,e;case Q:case h:return e=n|32,e=Dt(30,l,t,e),e.elementType=h,e.lanes=i,e.stateNode={autoName:null,paired:null,clones:null,ref:null},e;default:if(typeof a=="object"&&a!==null)switch(a.$$typeof){case je:r=10;break e;case Fe:r=9;break e;case K:r=11;break e;case ze:r=14;break e;case ce:r=16,a=null;break e}r=29,l=Error(c(130,e===null?"null":typeof e,"")),a=null}return t=Dt(r,l,t,n),t.elementType=e,t.type=a,t.lanes=i,t}function La(e,t,l,a){return e=Dt(7,e,a,t),e.lanes=l,e}function cr(e,t,l){return e=Dt(6,e,null,t),e.lanes=l,e}function Lf(e){var t=Dt(18,null,null,0);return t.stateNode=e,t}function or(e,t,l){return t=Dt(4,e.children!==null?e.children:[],e.key,t),t.lanes=l,t.stateNode={containerInfo:e.containerInfo,pendingChildren:null,implementation:e.implementation},t}var Hf=new WeakMap;function tl(e,t){if(typeof e=="object"&&e!==null){var l=Hf.get(e);return l!==void 0?l:(t={value:e,source:t,stack:ei(t)},Hf.set(e,t),t)}return{value:e,source:t,stack:ei(t)}}var yn=[],bn=0,yu=null,gi=0,ll=[],al=0,ea=null,bl=1,Sl="";function Yl(e,t){yn[bn++]=gi,yn[bn++]=yu,yu=e,gi=t}function Bf(e,t,l){ll[al++]=bl,ll[al++]=Sl,ll[al++]=ea,ea=e;var a=bl;e=Sl;var n=32-it(a)-1;a&=~(1<<n),l+=1;var i=32-it(t)+n;if(30<i){var r=n-n%5;i=(a&(1<<r)-1).toString(32),a>>=r,n-=r,bl=1<<32-it(t)+n|l<<n|a,Sl=i+e}else bl=1<<i|l<<n|a,Sl=e}function bu(e){e.return!==null&&(Yl(e,1),Bf(e,1,0))}function fr(e){for(;e===yu;)yu=yn[--bn],yn[bn]=null,gi=yn[--bn],yn[bn]=null;for(;e===ea;)ea=ll[--al],ll[al]=null,Sl=ll[--al],ll[al]=null,bl=ll[--al],ll[al]=null}function qf(e,t){ll[al++]=bl,ll[al++]=Sl,ll[al++]=ea,bl=t.id,Sl=t.overflow,ea=e}var mt=null,Ke=null,_e=!1,ta=null,nl=!1,dr=Error(c(519));function la(e){var t=Error(c(418,1<arguments.length&&arguments[1]!==void 0&&arguments[1]?"text":"HTML",""));throw xi(tl(t,e)),dr}function Yf(e){var t=e.stateNode,l=e.type,a=e.memoizedProps;switch(t[xt]=e,t[Mt]=a,l){case"dialog":Ce("cancel",t),Ce("close",t);break;case"iframe":case"object":case"embed":Ce("load",t);break;case"video":case"audio":for(l=0;l<qi.length;l++)Ce(qi[l],t);break;case"source":Ce("error",t);break;case"img":case"image":case"link":Ce("error",t),Ce("load",t);break;case"details":Ce("toggle",t);break;case"input":Ce("invalid",t),Io(t,a.value,a.defaultValue,a.checked,a.defaultChecked,a.type,a.name,!0);break;case"select":Ce("invalid",t);break;case"textarea":Ce("invalid",t),Po(t,a.value,a.defaultValue,a.children)}l=a.children,typeof l!="string"&&typeof l!="number"&&typeof l!="bigint"||t.textContent===""+l||a.suppressHydrationWarning===!0||sh(t.textContent,l)?(a.popover!=null&&(Ce("beforetoggle",t),Ce("toggle",t)),a.onScroll!=null&&Ce("scroll",t),a.onScrollEnd!=null&&Ce("scrollend",t),a.onClick!=null&&(t.onclick=yl),t=!0):t=!1,t||la(e,!0)}function Su(e){for(mt=e.return;mt;)switch(mt.tag){case 5:case 31:case 13:nl=!1;return;case 27:case 3:nl=!0;return;default:mt=mt.return}}function Sn(e){if(e!==mt)return!1;if(!_e)return Su(e),_e=!0,!1;var t=e.tag,l;if((l=t!==3&&t!==27)&&((l=t===5)&&(l=e.type,l=!(l!=="form"&&l!=="button")||kc(e.type,e.memoizedProps)),l=!l),l&&Ke&&la(e),Su(e),t===13){if(e=e.memoizedState,e=e!==null?e.dehydrated:null,!e)throw Error(c(317));Ke=Th(e)}else if(t===31){if(e=e.memoizedState,e=e!==null?e.dehydrated:null,!e)throw Error(c(317));Ke=Th(e)}else t===27?(t=Ke,va(e.type)?(e=Ic,Ic=null,Ke=e):Ke=t):Ke=mt?ul(e.stateNode.nextSibling):null;return!0}function Ha(){Ke=mt=null,_e=!1}function mr(){var e=ta;return e!==null&&(Ht===null?Ht=e:Ht.push.apply(Ht,e),ta=null),e}function xi(e){ta===null?ta=[e]:ta.push(e)}var hr=Ze(null),Ba=null,Gl=null;function aa(e,t,l){De(hr,t._currentValue),t._currentValue=l}function kl(e){e._currentValue=hr.current,Ie(hr)}function Nu(e,t,l){for(;e!==null;){var a=e.alternate;if((e.childLanes&t)!==t?(e.childLanes|=t,a!==null&&(a.childLanes|=t)):a!==null&&(a.childLanes&t)!==t&&(a.childLanes|=t),e===l)break;e=e.return}}function pr(e,t,l,a){var n=e.child;for(n!==null&&(n.return=e);n!==null;){var i=n.dependencies;if(i!==null){var r=n.child;i=i.firstContext;e:for(;i!==null;){var f=i;i=n;for(var x=0;x<t.length;x++)if(f.context===t[x]){i.lanes|=l,f=i.alternate,f!==null&&(f.lanes|=l),Nu(i.return,l,e),a||(r=null);break e}i=f.next}}else if(n.tag===18){if(r=n.return,r===null)throw Error(c(341));r.lanes|=l,i=r.alternate,i!==null&&(i.lanes|=l),Nu(r,l,e),r=null}else n.tag===13&&n.memoizedState!==null&&n.memoizedState.dehydrated===null?(n.lanes|=l,r=n.alternate,r!==null&&(r.lanes|=l),Nu(n.return,l,e),r=n.child,r=r!==null?r.sibling:null):r=n.child;if(r!==null)r.return=n;else for(r=n;r!==null;){if(r===e){r=null;break}if(n=r.sibling,n!==null){n.return=r.return,r=n;break}r=r.return}n=r}}function qa(e,t,l,a){e=null;for(var n=t,i=!1;n!==null;){if(!i){if(n.flags&524288)i=!0;else if(n.flags&262144)break}if(n.tag===10){var r=n.alternate;if(r===null)throw Error(c(387));if(r=r.memoizedProps,r!==null){var f=n.type;kt(n.pendingProps.value,r.value)||(e!==null?e.push(f):e=[f])}}else if(n===jt.current){if(r=n.alternate,r===null)throw Error(c(387));r.memoizedState.memoizedState!==n.memoizedState.memoizedState&&(e!==null?e.push(Zn):e=[Zn])}n=n.return}return e!==null&&pr(t,e,l,a),t.flags|=262144,e!==null}function _u(e){for(e=e.firstContext;e!==null;){if(!kt(e.context._currentValue,e.memoizedValue))return!0;e=e.next}return!1}function Ya(e){Ba=e,Gl=null,e=e.dependencies,e!==null&&(e.firstContext=null)}function vt(e){return Gf(Ba,e)}function ju(e,t){return Ba===null&&Ya(e),Gf(e,t)}function Gf(e,t){var l=t._currentValue;if(t={context:t,memoizedValue:l,next:null},Gl===null){if(e===null)throw Error(c(308));Gl=t,e.dependencies={lanes:0,firstContext:t},e.flags|=524288}else Gl=Gl.next=t;return l}var Vg=typeof AbortController<"u"?AbortController:function(){var e=[],t=this.signal={aborted:!1,addEventListener:function(l,a){e.push(a)}};this.abort=function(){t.aborted=!0,e.forEach(function(l){return l()})}},Zg=s.unstable_scheduleCallback,Kg=s.unstable_NormalPriority,ut={$$typeof:je,Consumer:null,Provider:null,_currentValue:null,_currentValue2:null,_threadCount:0};function gr(){return{controller:new Vg,data:new Map,refCount:0}}function vi(e){e.refCount--,e.refCount===0&&Zg(Kg,function(){e.controller.abort()})}function kf(e,t){if(e.pendingLanes&4194048){var l=e.transitionTypes;for(l===null&&(l=e.transitionTypes=[]),e=0;e<t.length;e++){var a=t[e];l.indexOf(a)===-1&&l.push(a)}}}var yi=null;function Jg(e){var t=e.transitionTypes;return e.transitionTypes=null,t}var bi=null,xr=0,Ga=0,Nn=null;function $g(e,t){if(bi===null){var l=bi=[];xr=0,Ga=Mc(),Nn={status:"pending",value:void 0,then:function(a){l.push(a)}}}return xr++,t.then(Qf,Qf),t}function Qf(){if(--xr===0&&(yi=null,bi!==null)){Nn!==null&&(Nn.status="fulfilled");var e=bi;bi=null,Ga=0,Nn=null;for(var t=0;t<e.length;t++)(0,e[t])()}}function Fg(e,t){var l=[],a={status:"pending",value:null,reason:null,then:function(n){l.push(n)}};return e.then(function(){a.status="fulfilled",a.value=t;for(var n=0;n<l.length;n++)(0,l[n])(t)},function(n){for(a.status="rejected",a.reason=n,n=0;n<l.length;n++)(0,l[n])(void 0)}),a}var Xf=ae.S;ae.S=function(e,t){if(Lm=M(),typeof t=="object"&&t!==null&&typeof t.then=="function"&&$g(e,t),yi!==null)for(var l=Yn;l!==null;)kf(l,yi),l=l.next;if(l=e.types,l!==null){for(var a=Yn;a!==null;)kf(a,l),a=a.next;if(Ga!==0){a=yi,a===null&&(a=yi=[]);for(var n=0;n<l.length;n++){var i=l[n];a.indexOf(i)===-1&&a.push(i)}}}Xf!==null&&Xf(e,t)};var ka=Ze(null);function vr(){var e=ka.current;return e!==null?e:Ve.pooledCache}function Eu(e,t){t===null?De(ka,ka.current):De(ka,t.pool)}function Vf(){var e=vr();return e===null?null:{parent:ut._currentValue,pool:e}}var _n=Error(c(460)),yr=Error(c(474)),Tu=Error(c(542)),Cu={then:function(){}};function Zf(e){return e=e.status,e==="fulfilled"||e==="rejected"}function Kf(e,t,l){switch(l=e[l],l===void 0?e.push(t):l!==t&&(t.then(yl,yl),t=l),t.status){case"fulfilled":return t.value;case"rejected":throw e=t.reason,$f(e),e===void 0&&!("reason"in t)?Error(c(600)):e;default:if(typeof t.status=="string")t.then(yl,yl);else{if(e=Ve,e!==null&&100<e.shellSuspendCounter)throw Error(c(482));e=t,e.status="pending",e.then(function(a){if(t.status==="pending"){var n=t;n.status="fulfilled",n.value=a}},function(a){if(t.status==="pending"){var n=t;n.status="rejected",n.reason=a}})}switch(t.status){case"fulfilled":return t.value;case"rejected":throw e=t.reason,$f(e),e}throw Xa=t,_n}}function Qa(e){try{var t=e._init;return t(e._payload)}catch(l){throw l!==null&&typeof l=="object"&&typeof l.then=="function"?(Xa=l,_n):l}}var Xa=null;function Jf(){if(Xa===null)throw Error(c(459));var e=Xa;return Xa=null,e}function $f(e){if(e===_n||e===Tu)throw Error(c(483))}var jn=null,Si=0;function zu(e){var t=Si;return Si+=1,jn===null&&(jn=[]),Kf(jn,e,t)}function na(e,t){t=t.props.ref,e.ref=t!==void 0?t:null}function Au(e,t){throw t.$$typeof===ie?Error(c(525)):(e=Object.prototype.toString.call(t),Error(c(31,e==="[object Object]"?"object with keys {"+Object.keys(t).join(", ")+"}":e)))}function Ff(e){function t(j,S){if(e){var R=j.deletions;R===null?(j.deletions=[S],j.flags|=16):R.push(S)}}function l(j,S){if(!e)return null;for(;S!==null;)t(j,S),S=S.sibling;return null}function a(j){for(var S=new Map;j!==null;)j.key===null?S.set(j.index,j):S.set(j.key,j),j=j.sibling;return S}function n(j,S){return j=ql(j,S),j.index=0,j.sibling=null,j}function i(j,S,R){return j.index=R,e?(R=j.alternate,R!==null?(R=R.index,R<S?(j.flags|=2,S):R):(j.flags|=134217730,S)):(j.flags|=1048576,S)}function r(j){return e&&j.alternate===null&&(j.flags|=134217730),j}function f(j,S,R,L){return S===null||S.tag!==6?(S=cr(R,j.mode,L),S.return=j,S):(S=n(S,R),S.return=j,S)}function x(j,S,R,L){var W=R.type;return W===Be?(j=w(j,S,R.props.children,L,R.key),na(j,R),j):S!==null&&(S.elementType===W||typeof W=="object"&&W!==null&&W.$$typeof===ce&&Qa(W)===S.type)?(S=n(S,R.props),na(S,R),S.return=j,S):(S=vu(R.type,R.key,R.props,null,j.mode,L),na(S,R),S.return=j,S)}function E(j,S,R,L){return S===null||S.tag!==4||S.stateNode.containerInfo!==R.containerInfo||S.stateNode.implementation!==R.implementation?(S=or(R,j.mode,L),S.return=j,S):(S=n(S,R.children||[]),S.return=j,S)}function w(j,S,R,L,W){return S===null||S.tag!==7?(S=La(R,j.mode,L,W),S.return=j,S):(S=n(S,R),S.return=j,S)}function H(j,S,R){if(typeof S=="string"&&S!==""||typeof S=="number"||typeof S=="bigint")return S=cr(""+S,j.mode,R),S.return=j,S;if(typeof S=="object"&&S!==null){switch(S.$$typeof){case He:return R=vu(S.type,S.key,S.props,null,j.mode,R),na(R,S),R.return=j,R;case Z:return S=or(S,j.mode,R),S.return=j,S;case ce:return S=Qa(S),H(j,S,R)}if(Ae(S)||G(S))return S=La(S,j.mode,R,null),S.return=j,S;if(typeof S.then=="function")return H(j,zu(S),R);if(S.$$typeof===je)return H(j,ju(j,S),R);Au(j,S)}return null}function _(j,S,R,L){var W=S!==null?S.key:null;if(typeof R=="string"&&R!==""||typeof R=="number"||typeof R=="bigint")return W!==null?null:f(j,S,""+R,L);if(typeof R=="object"&&R!==null){switch(R.$$typeof){case He:return R.key===W?x(j,S,R,L):null;case Z:return R.key===W?E(j,S,R,L):null;case ce:return R=Qa(R),_(j,S,R,L)}if(Ae(R)||G(R))return W!==null?null:w(j,S,R,L,null);if(typeof R.then=="function")return _(j,S,zu(R),L);if(R.$$typeof===je)return _(j,S,ju(j,R),L);Au(j,R)}return null}function O(j,S,R,L,W){if(typeof L=="string"&&L!==""||typeof L=="number"||typeof L=="bigint")return j=j.get(R)||null,f(S,j,""+L,W);if(typeof L=="object"&&L!==null){switch(L.$$typeof){case He:return j=j.get(L.key===null?R:L.key)||null,x(S,j,L,W);case Z:return j=j.get(L.key===null?R:L.key)||null,E(S,j,L,W);case ce:return L=Qa(L),O(j,S,R,L,W)}if(Ae(L)||G(L))return j=j.get(R)||null,w(S,j,L,W,null);if(typeof L.then=="function")return O(j,S,R,zu(L),W);if(L.$$typeof===je)return O(j,S,R,ju(S,L),W);Au(S,L)}return null}function $(j,S,R,L){for(var W=null,Oe=null,oe=S,pe=S=0,ct=null;oe!==null&&pe<R.length;pe++){oe.index>pe?(ct=oe,oe=null):ct=oe.sibling;var we=_(j,oe,R[pe],L);if(we===null){oe===null&&(oe=ct);break}e&&oe&&we.alternate===null&&t(j,oe),S=i(we,S,pe),Oe===null?W=we:Oe.sibling=we,Oe=we,oe=ct}if(pe===R.length)return l(j,oe),_e&&Yl(j,pe),W;if(oe===null){for(;pe<R.length;pe++)oe=H(j,R[pe],L),oe!==null&&(S=i(oe,S,pe),Oe===null?W=oe:Oe.sibling=oe,Oe=oe);return _e&&Yl(j,pe),W}for(oe=a(oe);pe<R.length;pe++)ct=O(oe,j,pe,R[pe],L),ct!==null&&(e&&(we=ct.alternate,we!==null&&oe.delete(we.key===null?pe:we.key)),S=i(ct,S,pe),Oe===null?W=ct:Oe.sibling=ct,Oe=ct);return e&&oe.forEach(function(_a){return t(j,_a)}),_e&&Yl(j,pe),W}function te(j,S,R,L){if(R==null)throw Error(c(151));for(var W=null,Oe=null,oe=S,pe=S=0,ct=null,we=R.next();oe!==null&&!we.done;pe++,we=R.next()){oe.index>pe?(ct=oe,oe=null):ct=oe.sibling;var _a=_(j,oe,we.value,L);if(_a===null){oe===null&&(oe=ct);break}e&&oe&&_a.alternate===null&&t(j,oe),S=i(_a,S,pe),Oe===null?W=_a:Oe.sibling=_a,Oe=_a,oe=ct}if(we.done)return l(j,oe),_e&&Yl(j,pe),W;if(oe===null){for(;!we.done;pe++,we=R.next())we=H(j,we.value,L),we!==null&&(S=i(we,S,pe),Oe===null?W=we:Oe.sibling=we,Oe=we);return _e&&Yl(j,pe),W}for(oe=a(oe);!we.done;pe++,we=R.next())we=O(oe,j,pe,we.value,L),we!==null&&(e&&(ct=we.alternate,ct!==null&&oe.delete(ct.key===null?pe:ct.key)),S=i(we,S,pe),Oe===null?W=we:Oe.sibling=we,Oe=we);return e&&oe.forEach(function(Rv){return t(j,Rv)}),_e&&Yl(j,pe),W}function Se(j,S,R,L){if(typeof R=="object"&&R!==null&&R.type===Be&&R.key===null&&R.props.ref===void 0&&(R=R.props.children),typeof R=="object"&&R!==null){switch(R.$$typeof){case He:e:{for(var W=R.key;S!==null;){if(S.key===W){if(W=R.type,W===Be){if(S.tag===7){l(j,S.sibling),L=n(S,R.props.children),na(L,R),L.return=j,j=L;break e}}else if(S.elementType===W||typeof W=="object"&&W!==null&&W.$$typeof===ce&&Qa(W)===S.type){l(j,S.sibling),L=n(S,R.props),na(L,R),L.return=j,j=L;break e}l(j,S);break}else t(j,S);S=S.sibling}R.type===Be?(L=La(R.props.children,j.mode,L,R.key),na(L,R),L.return=j,j=L):(L=vu(R.type,R.key,R.props,null,j.mode,L),na(L,R),L.return=j,j=L)}return r(j);case Z:e:{for(W=R.key;S!==null;){if(S.key===W)if(S.tag===4&&S.stateNode.containerInfo===R.containerInfo&&S.stateNode.implementation===R.implementation){l(j,S.sibling),L=n(S,R.children||[]),L.return=j,j=L;break e}else{l(j,S);break}else t(j,S);S=S.sibling}L=or(R,j.mode,L),L.return=j,j=L}return r(j);case ce:return R=Qa(R),Se(j,S,R,L)}if(Ae(R))return $(j,S,R,L);if(G(R)){if(W=G(R),typeof W!="function")throw Error(c(150));return R=W.call(R),te(j,S,R,L)}if(typeof R.then=="function")return Se(j,S,zu(R),L);if(R.$$typeof===je)return Se(j,S,ju(j,R),L);Au(j,R)}return typeof R=="string"&&R!==""||typeof R=="number"||typeof R=="bigint"?(R=""+R,S!==null&&S.tag===6?(l(j,S.sibling),L=n(S,R),L.return=j,j=L):(l(j,S),L=cr(R,j.mode,L),L.return=j,j=L),r(j)):l(j,S)}return function(j,S,R,L){try{Si=0;var W=Se(j,S,R,L);return jn=null,W}catch(oe){if(oe===_n||oe===Tu)throw oe;var Oe=Dt(29,oe,null,j.mode);return Oe.lanes=L,Oe.return=j,Oe}finally{}}}var Va=Ff(!0),If=Ff(!1),ia=!1;function br(e){e.updateQueue={baseState:e.memoizedState,firstBaseUpdate:null,lastBaseUpdate:null,shared:{pending:null,lanes:0,hiddenCallbacks:null},callbacks:null}}function Sr(e,t){e=e.updateQueue,t.updateQueue===e&&(t.updateQueue={baseState:e.baseState,firstBaseUpdate:e.firstBaseUpdate,lastBaseUpdate:e.lastBaseUpdate,shared:e.shared,callbacks:null})}function ua(e){return{lane:e,tag:0,payload:null,callback:null,next:null}}function sa(e,t,l){var a=e.updateQueue;if(a===null)return null;if(a=a.shared,qe&2){var n=a.pending;return n===null?t.next=t:(t.next=n.next,n.next=t),a.pending=t,t=xu(e),Df(e,null,l),t}return gu(e,a,t,l),xu(e)}function Ni(e,t,l){if(t=t.updateQueue,t!==null&&(t=t.shared,(l&4194048)!==0)){var a=t.lanes;a&=e.pendingLanes,l|=a,t.lanes=l,Ho(e,l)}}function Nr(e,t){var l=e.updateQueue,a=e.alternate;if(a!==null&&(a=a.updateQueue,l===a)){var n=null,i=null;if(l=l.firstBaseUpdate,l!==null){do{var r={lane:l.lane,tag:l.tag,payload:l.payload,callback:null,next:null};i===null?n=i=r:i=i.next=r,l=l.next}while(l!==null);i===null?n=i=t:i=i.next=t}else n=i=t;l={baseState:a.baseState,firstBaseUpdate:n,lastBaseUpdate:i,shared:a.shared,callbacks:a.callbacks},e.updateQueue=l;return}e=l.lastBaseUpdate,e===null?l.firstBaseUpdate=t:e.next=t,l.lastBaseUpdate=t}var _r=!1;function _i(){if(_r){var e=Nn;if(e!==null)throw e}}function ji(e,t,l,a){_r=!1;var n=e.updateQueue;ia=!1;var i=n.firstBaseUpdate,r=n.lastBaseUpdate,f=n.shared.pending;if(f!==null){n.shared.pending=null;var x=f,E=x.next;x.next=null,r===null?i=E:r.next=E,r=x;var w=e.alternate;w!==null&&(w=w.updateQueue,f=w.lastBaseUpdate,f!==r&&(f===null?w.firstBaseUpdate=E:f.next=E,w.lastBaseUpdate=x))}if(i!==null){var H=n.baseState;r=0,w=E=x=null,f=i;do{var _=f.lane&-536870913,O=_!==f.lane;if(O?(Re&_)===_:(a&_)===_){_!==0&&_===Ga&&(_r=!0),w!==null&&(w=w.next={lane:0,tag:f.tag,payload:f.payload,callback:null,next:null});e:{var $=e,te=f;_=t;var Se=l;switch(te.tag){case 1:if($=te.payload,typeof $=="function"){H=$.call(Se,H,_);break e}H=$;break e;case 3:$.flags=$.flags&-65537|128;case 0:if($=te.payload,_=typeof $=="function"?$.call(Se,H,_):$,_==null)break e;H=I({},H,_);break e;case 2:ia=!0}}_=f.callback,_!==null&&(e.flags|=64,O&&(e.flags|=8192),O=n.callbacks,O===null?n.callbacks=[_]:O.push(_))}else O={lane:_,tag:f.tag,payload:f.payload,callback:f.callback,next:null},w===null?(E=w=O,x=H):w=w.next=O,r|=_;if(f=f.next,f===null){if(f=n.shared.pending,f===null)break;O=f,f=O.next,O.next=null,n.lastBaseUpdate=O,n.shared.pending=null}}while(!0);w===null&&(x=H),n.baseState=x,n.firstBaseUpdate=E,n.lastBaseUpdate=w,i===null&&(n.shared.lanes=0),ha|=r,e.lanes=r,e.memoizedState=H}}function Wf(e,t){if(typeof e!="function")throw Error(c(191,e));e.call(t)}function Pf(e,t){var l=e.callbacks;if(l!==null)for(e.callbacks=null,e=0;e<l.length;e++)Wf(l[e],t)}var ra=Ze(null),Ru=Ze(0);function ed(e,t){e=Kl,De(Ru,e),De(ra,t),Kl=e|t.baseLanes}function jr(){De(Ru,Kl),De(ra,ra.current)}function Er(){Kl=Ru.current,Ie(ra),Ie(Ru)}var yt=Ze(null),Tt=null;function ca(e){var t=e.alternate;De(bt,bt.current&1),De(yt,e),Tt===null&&(t===null||ra.current!==null||t.memoizedState!==null)&&(Tt=e)}function Tr(e){De(bt,bt.current),De(yt,e),Tt===null&&(Tt=e)}function td(e){e.tag===22?(De(bt,bt.current),De(yt,e),Tt===null&&(Tt=e)):oa()}function oa(){De(bt,bt.current),De(yt,yt.current)}function Qt(e){Ie(yt),Tt===e&&(Tt=null),Ie(bt)}var bt=Ze(0);function Ei(e,t){De(yt,yt.current),De(bt,t)}function Cr(e){Ie(bt),Ie(yt),Tt===e&&(Tt=null)}function Ou(e){for(var t=e;t!==null;){if(t.tag===13){var l=t.memoizedState;if(l!==null&&(l=l.dehydrated,l===null||$c(l)||Fc(l)))return t}else if(t.tag===19&&t.memoizedProps.revealOrder!=="independent"){if(t.flags&128)return t}else if(t.child!==null){t.child.return=t,t=t.child;continue}if(t===e)break;for(;t.sibling===null;){if(t.return===null||t.return===e)return null;t=t.return}t.sibling.return=t.return,t=t.sibling}return null}var Ql=0,be=null,Xe=null,st=null,wu=!1,En=!1,Za=!1,Mu=0,Ti=0,Tn=null,Ig=0;function tt(){throw Error(c(321))}function zr(e,t){if(t===null)return!1;for(var l=0;l<t.length&&l<e.length;l++)if(!kt(e[l],t[l]))return!1;return!0}function Ar(e,t,l,a,n,i){return Ql=i,be=t,t.memoizedState=null,t.updateQueue=null,t.lanes=0,ae.H=e===null||e.memoizedState===null?Bd:qd,Za=!1,i=l(a,n),Za=!1,En&&(i=ad(t,l,a,n)),ld(e),i}function ld(e){ae.H=Yu;var t=Xe!==null&&Xe.next!==null;if(Ql=0,st=Xe=be=null,wu=!1,Ti=0,Tn=null,t)throw Error(c(300));e===null||rt||(e=e.dependencies,e!==null&&_u(e)&&(rt=!0))}function ad(e,t,l,a){be=e;var n=0;do{if(En&&(Tn=null),Ti=0,En=!1,25<=n)throw Error(c(301));if(n+=1,st=Xe=null,e.updateQueue!=null){var i=e.updateQueue;i.lastEffect=null,i.events=null,i.stores=null,i.memoCache!=null&&(i.memoCache.index=0)}ae.H=ix,i=t(l,a)}while(En);return i}function Wg(){var e=ae.H,t=e.useState()[0];return t=typeof t.then=="function"?Ci(t):t,e=e.useState()[0],(Xe!==null?Xe.memoizedState:null)!==e&&(be.flags|=1024),t}function Rr(){var e=Mu!==0;return Mu=0,e}function Or(e,t,l){t.updateQueue=e.updateQueue,t.flags&=-2053,e.lanes&=~l}function wr(e){if(wu){for(e=e.memoizedState;e!==null;){var t=e.queue;t!==null&&(t.pending=null),e=e.next}wu=!1}Ql=0,st=Xe=be=null,En=!1,Ti=Mu=0,Tn=null}function At(){var e={memoizedState:null,baseState:null,baseQueue:null,queue:null,next:null};return st===null?be.memoizedState=st=e:st=st.next=e,st}function at(){if(Xe===null){var e=be.alternate;e=e!==null?e.memoizedState:null}else e=Xe.next;var t=st===null?be.memoizedState:st.next;if(t!==null)st=t,Xe=e;else{if(e===null)throw be.alternate===null?Error(c(467)):Error(c(310));Xe=e,e={memoizedState:Xe.memoizedState,baseState:Xe.baseState,baseQueue:Xe.baseQueue,queue:Xe.queue,next:null},st===null?be.memoizedState=st=e:st=st.next=e}return st}function Du(){return{lastEffect:null,events:null,stores:null,memoCache:null}}function Ci(e){var t=Ti;return Ti+=1,Tn===null&&(Tn=[]),e=Kf(Tn,e,t),t=be,(st===null?t.memoizedState:st.next)===null&&(t=t.alternate,ae.H=t===null||t.memoizedState===null?Bd:qd),e}function Uu(e){if(e!==null&&typeof e=="object"){if(typeof e.then=="function")return Ci(e);if(e.$$typeof===D)return;if(e.$$typeof===je)return vt(e)}throw Error(c(438,String(e)))}function Mr(e){var t=null,l=be.updateQueue;if(l!==null&&(t=l.memoCache),t==null){var a=be.alternate;a!==null&&(a=a.updateQueue,a!==null&&(a=a.memoCache,a!=null&&(t={data:a.data.map(function(n){return n.slice()}),index:0})))}if(t==null&&(t={data:[],index:0}),l===null&&(l=Du(),be.updateQueue=l),l.memoCache=t,l=t.data[t.index],l===void 0)for(l=t.data[t.index]=Array(e),a=0;a<e;a++)l[a]=fe;return t.index++,l}function Xl(e,t){return typeof t=="function"?t(e):t}function Lu(e){var t=at();return Dr(t,Xe,e)}function Dr(e,t,l){var a=e.queue;if(a===null)throw Error(c(311));a.lastRenderedReducer=l;var n=e.baseQueue,i=a.pending;if(i!==null){if(n!==null){var r=n.next;n.next=i.next,i.next=r}t.baseQueue=n=i,a.pending=null}if(i=e.baseState,n===null)e.memoizedState=i;else{t=n.next;var f=r=null,x=null,E=t,w=!1;do{var H=E.lane&-536870913;if(H!==E.lane?(Re&H)===H:(Ql&H)===H){var _=E.revertLane;if(_===0)x!==null&&(x=x.next={lane:0,revertLane:0,gesture:null,action:E.action,hasEagerState:E.hasEagerState,eagerState:E.eagerState,next:null}),H===Ga&&(w=!0);else if((Ql&_)===_){E=E.next,_===Ga&&(w=!0);continue}else H={lane:0,revertLane:E.revertLane,gesture:null,action:E.action,hasEagerState:E.hasEagerState,eagerState:E.eagerState,next:null},x===null?(f=x=H,r=i):x=x.next=H,be.lanes|=_,ha|=_;H=E.action,Za&&l(i,H),i=E.hasEagerState?E.eagerState:l(i,H)}else _={lane:H,revertLane:E.revertLane,gesture:E.gesture,action:E.action,hasEagerState:E.hasEagerState,eagerState:E.eagerState,next:null},x===null?(f=x=_,r=i):x=x.next=_,be.lanes|=H,ha|=H;E=E.next}while(E!==null&&E!==t);if(x===null?r=i:x.next=f,!kt(i,e.memoizedState)&&(rt=!0,w&&(l=Nn,l!==null)))throw l;e.memoizedState=i,e.baseState=r,e.baseQueue=x,a.lastRenderedState=i}return n===null&&(a.lanes=0),[e.memoizedState,a.dispatch]}function Ur(e){var t=at(),l=t.queue;if(l===null)throw Error(c(311));l.lastRenderedReducer=e;var a=l.dispatch,n=l.pending,i=t.memoizedState;if(n!==null){l.pending=null;var r=n=n.next;do i=e(i,r.action),r=r.next;while(r!==n);kt(i,t.memoizedState)||(rt=!0),t.memoizedState=i,t.baseQueue===null&&(t.baseState=i),l.lastRenderedState=i}return[i,a]}function nd(e,t,l){var a=be,n=at(),i=_e;if(i){if(l===void 0)throw Error(c(407));l=l()}else l=t();var r=!kt((Xe||n).memoizedState,l);if(r&&(n.memoizedState=l,rt=!0),n=n.queue,Br(sd.bind(null,a,n,e),[e]),e=n.getSnapshot!==t||r||st!==null&&(st.memoizedState.tag&1)!==0,Cn(e?9:8,{destroy:void 0},ud.bind(null,a,n,l,t),null),e){if(a.flags|=2048,Ve===null)throw Error(c(349));i||Ql&127||id(a,t,l)}return l}function id(e,t,l){e.flags|=16384,e={getSnapshot:t,value:l},t=be.updateQueue,t===null?(t=Du(),be.updateQueue=t,t.stores=[e]):(l=t.stores,l===null?t.stores=[e]:l.push(e))}function ud(e,t,l,a){t.value=l,t.getSnapshot=a,rd(t)&&cd(e)}function sd(e,t,l){return l(function(){rd(t)&&cd(e)})}function rd(e){var t=e.getSnapshot;e=e.value;try{var l=t();return!kt(e,l)}catch{return!0}}function cd(e){var t=Ua(e,2);t!==null&&Bt(t,e,2)}function Lr(e){var t=At();if(typeof e=="function"){var l=e;if(e=l(),Za){Ct(!0);try{l()}finally{Ct(!1)}}}return t.memoizedState=t.baseState=e,t.queue={pending:null,lanes:0,dispatch:null,lastRenderedReducer:Xl,lastRenderedState:e},t}function od(e,t,l,a){return e.baseState=l,Dr(e,Xe,typeof a=="function"?a:Xl)}function Pg(e,t,l,a,n){if(qu(e))throw Error(c(485));if(e=t.action,e!==null){var i={payload:n,action:e,next:null,isTransition:!0,status:"pending",value:null,reason:null,listeners:[],then:function(r){i.listeners.push(r)}};ae.T!==null?l(!0):i.isTransition=!1,a(i),l=t.pending,l===null?(i.next=t.pending=i,fd(t,i)):(i.next=l.next,t.pending=l.next=i)}}function fd(e,t){var l=t.action,a=t.payload,n=e.state;if(t.isTransition){var i=ae.T,r={};r.types=i!==null?i.types:null,ae.T=r;try{var f=l(n,a),x=ae.S;x!==null&&x(r,f),dd(e,t,f)}catch(E){Hr(e,t,E)}finally{i!==null&&r.types!==null&&(i.types=r.types),ae.T=i}}else try{i=l(n,a),dd(e,t,i)}catch(E){Hr(e,t,E)}}function dd(e,t,l){l!==null&&typeof l=="object"&&typeof l.then=="function"?l.then(function(a){md(e,t,a)},function(a){return Hr(e,t,a)}):md(e,t,l)}function md(e,t,l){t.status="fulfilled",t.value=l,hd(t),e.state=l,t=e.pending,t!==null&&(l=t.next,l===t?e.pending=null:(l=l.next,t.next=l,fd(e,l)))}function Hr(e,t,l){var a=e.pending;if(e.pending=null,a!==null){a=a.next;do t.status="rejected",t.reason=l,hd(t),t=t.next;while(t!==a)}e.action=null}function hd(e){e=e.listeners;for(var t=0;t<e.length;t++)(0,e[t])()}function pd(e,t){return t}function gd(e,t){if(_e){var l=Ve.formState;if(l!==null){e:{var a=be;if(_e){if(Ke){t:{for(var n=Ke,i=nl;n.nodeType!==8;){if(!i){n=null;break t}if(n=ul(n.nextSibling),n===null){n=null;break t}}i=n.data,n=i==="F!"||i==="F"?n:null}if(n){Ke=ul(n.nextSibling),a=n.data==="F!";break e}}la(a)}a=!1}a&&(t=l[0])}}return l=At(),l.memoizedState=l.baseState=t,a={pending:null,lanes:0,dispatch:null,lastRenderedReducer:pd,lastRenderedState:t},l.queue=a,l=Ud.bind(null,be,a),a.dispatch=l,a=Lr(!1),i=Qr.bind(null,be,!1,a.queue),a=At(),n={state:t,dispatch:null,action:e,pending:null},a.queue=n,l=Pg.bind(null,be,n,i,l),n.dispatch=l,a.memoizedState=e,[t,l,!1]}function xd(e){var t=at();return vd(t,Xe,e)}function vd(e,t,l){if(t=Dr(e,t,pd)[0],e=Lu(Xl)[0],typeof t=="object"&&t!==null&&typeof t.then=="function")try{var a=Ci(t)}catch(r){throw r===_n?Tu:r}else a=t;t=at();var n=t.queue,i=n.dispatch;return l!==t.memoizedState&&(be.flags|=2048,Cn(9,{destroy:void 0},ex.bind(null,n,l),null)),[a,i,e]}function ex(e,t){e.action=t}function yd(e){var t=at(),l=Xe;if(l!==null)return vd(t,l,e);at(),t=t.memoizedState,l=at();var a=l.queue.dispatch;return l.memoizedState=e,[t,a,!1]}function Cn(e,t,l,a){return e={tag:e,create:l,deps:a,inst:t,next:null},t=be.updateQueue,t===null&&(t=Du(),be.updateQueue=t),l=t.lastEffect,l===null?t.lastEffect=e.next=e:(a=l.next,l.next=e,e.next=a,t.lastEffect=e),e}function bd(){return at().memoizedState}function Hu(e,t,l,a){var n=At();be.flags|=e,n.memoizedState=Cn(1|t,{destroy:void 0},l,a===void 0?null:a)}function Bu(e,t,l,a){var n=at();a=a===void 0?null:a;var i=n.memoizedState.inst;Xe!==null&&a!==null&&zr(a,Xe.memoizedState.deps)?n.memoizedState=Cn(t,i,l,a):(be.flags|=e,n.memoizedState=Cn(1|t,i,l,a))}function Sd(e,t){Hu(8390656,8,e,t)}function Br(e,t){Bu(2048,8,e,t)}function tx(e){be.flags|=4;var t=be.updateQueue;if(t===null)t=Du(),be.updateQueue=t,t.events=[e];else{var l=t.events;l===null?t.events=[e]:l.push(e)}}function Nd(e){var t=at().memoizedState;return tx({ref:t,nextImpl:e}),function(){if(qe&2)throw Error(c(440));return t.impl.apply(void 0,arguments)}}function _d(e,t){return Bu(4,2,e,t)}function jd(e,t){return Bu(4,4,e,t)}function Ed(e,t){if(typeof t=="function"){e=e();var l=t(e);return function(){typeof l=="function"?l():t(null)}}if(t!=null)return e=e(),t.current=e,function(){t.current=null}}function Td(e,t,l){l=l!=null?l.concat([e]):null,Bu(4,4,Ed.bind(null,t,e),l)}function qr(){}function Cd(e,t){var l=at();t=t===void 0?null:t;var a=l.memoizedState;return t!==null&&zr(t,a[1])?a[0]:(l.memoizedState=[e,t],e)}function zd(e,t){var l=at();t=t===void 0?null:t;var a=l.memoizedState;if(t!==null&&zr(t,a[1]))return a[0];if(a=e(),Za){Ct(!0);try{e()}finally{Ct(!1)}}return l.memoizedState=[a,t],a}function Yr(e,t,l){return l===void 0||Ql&1073741824&&!(Re&261930)?e.memoizedState=t:(e.memoizedState=l,e=Bm(),be.lanes|=e,ha|=e,l)}function Ad(e,t,l,a){return kt(l,t)?l:ra.current!==null?(e=Yr(e,l,a),kt(e,t)||(rt=!0),e):!(Ql&106)||Ql&1073741824&&!(Re&261930)?(rt=!0,e.memoizedState=l):(e=Bm(),be.lanes|=e,ha|=e,t)}function Rd(e,t,l,a,n){var i=ne.p;ne.p=i!==0&&8>i?i:8;var r=ae.T,f={};f.types=r!==null?r.types:null,ae.T=f,Qr(e,!1,t,l);try{var x=n(),E=ae.S;if(E!==null&&E(f,x),x!==null&&typeof x=="object"&&typeof x.then=="function"){var w=Fg(x,a);zi(e,t,w,Kt(e))}else zi(e,t,a,Kt(e))}catch(H){zi(e,t,{then:function(){},status:"rejected",reason:H},Kt())}finally{ne.p=i,r!==null&&f.types!==null&&(r.types=f.types),ae.T=r}}function lx(){}function Gr(e,t,l,a){if(e.tag!==5)throw Error(c(476));var n=Od(e).queue;Rd(e,n,t,Me,l===null?lx:function(){return wd(e),l(a)})}function Od(e){var t=e.memoizedState;if(t!==null)return t;t={memoizedState:Me,baseState:Me,baseQueue:null,queue:{pending:null,lanes:0,dispatch:null,lastRenderedReducer:Xl,lastRenderedState:Me},next:null};var l={};return t.next={memoizedState:l,baseState:l,baseQueue:null,queue:{pending:null,lanes:0,dispatch:null,lastRenderedReducer:Xl,lastRenderedState:l},next:null},e.memoizedState=t,e=e.alternate,e!==null&&(e.memoizedState=t),t}function wd(e){var t=Od(e);t.next===null&&(t=e.alternate.memoizedState),zi(e,t.next.queue,{},Kt())}function kr(){return vt(Zn)}function Md(){return at().memoizedState}function Dd(){return at().memoizedState}function ax(e){for(var t=e.return;t!==null;){switch(t.tag){case 24:case 3:var l=Kt();e=ua(l);var a=sa(t,e,l);a!==null&&(Bt(a,t,l),Ni(a,t,l)),t={cache:gr()},e.payload=t;return}t=t.return}}function nx(e,t,l){var a=Kt();l={lane:a,revertLane:0,gesture:null,action:l,hasEagerState:!1,eagerState:null,next:null},qu(e)?Ld(t,l):(l=sr(e,t,l,a),l!==null&&(Bt(l,e,a),Hd(l,t,a)))}function Ud(e,t,l){var a=Kt();zi(e,t,l,a)}function zi(e,t,l,a){var n={lane:a,revertLane:0,gesture:null,action:l,hasEagerState:!1,eagerState:null,next:null};if(qu(e))Ld(t,n);else{var i=e.alternate;if(e.lanes===0&&(i===null||i.lanes===0)&&(i=t.lastRenderedReducer,i!==null))try{var r=t.lastRenderedState,f=i(r,l);if(n.hasEagerState=!0,n.eagerState=f,kt(f,r))return gu(e,t,n,0),Ve===null&&pu(),!1}catch{}finally{}if(l=sr(e,t,n,a),l!==null)return Bt(l,e,a),Hd(l,t,a),!0}return!1}function Qr(e,t,l,a){if(a={lane:2,revertLane:Mc(),gesture:null,action:a,hasEagerState:!1,eagerState:null,next:null},qu(e)){if(t)throw Error(c(479))}else t=sr(e,l,a,2),t!==null&&Bt(t,e,2)}function qu(e){var t=e.alternate;return e===be||t!==null&&t===be}function Ld(e,t){En=wu=!0;var l=e.pending;l===null?t.next=t:(t.next=l.next,l.next=t),e.pending=t}function Hd(e,t,l){if(l&4194048){var a=t.lanes;a&=e.pendingLanes,l|=a,t.lanes=l,Ho(e,l)}}var Yu={readContext:vt,use:Uu,useCallback:tt,useContext:tt,useEffect:tt,useImperativeHandle:tt,useLayoutEffect:tt,useInsertionEffect:tt,useMemo:tt,useReducer:tt,useRef:tt,useState:tt,useDebugValue:tt,useDeferredValue:tt,useTransition:tt,useSyncExternalStore:tt,useId:tt,useHostTransitionStatus:tt,useFormState:tt,useActionState:tt,useOptimistic:tt,useMemoCache:tt,useCacheRefresh:tt,useEffectEvent:tt},Bd={readContext:vt,use:Uu,useCallback:function(e,t){return At().memoizedState=[e,t===void 0?null:t],e},useContext:vt,useEffect:Sd,useImperativeHandle:function(e,t,l){l=l!=null?l.concat([e]):null,Hu(4194308,4,Ed.bind(null,t,e),l)},useLayoutEffect:function(e,t){return Hu(4194308,4,e,t)},useInsertionEffect:function(e,t){Hu(4,2,e,t)},useMemo:function(e,t){var l=At();t=t===void 0?null:t;var a=e();if(Za){Ct(!0);try{e()}finally{Ct(!1)}}return l.memoizedState=[a,t],a},useReducer:function(e,t,l){var a=At();if(l!==void 0){var n=l(t);if(Za){Ct(!0);try{l(t)}finally{Ct(!1)}}}else n=t;return a.memoizedState=a.baseState=n,e={pending:null,lanes:0,dispatch:null,lastRenderedReducer:e,lastRenderedState:n},a.queue=e,e=e.dispatch=nx.bind(null,be,e),[a.memoizedState,e]},useRef:function(e){var t=At();return e={current:e},t.memoizedState=e},useState:function(e){e=Lr(e);var t=e.queue,l=Ud.bind(null,be,t);return t.dispatch=l,[e.memoizedState,l]},useDebugValue:qr,useDeferredValue:function(e,t){var l=At();return Yr(l,e,t)},useTransition:function(){var e=Lr(!1);return e=Rd.bind(null,be,e.queue,!0,!1),At().memoizedState=e,[!1,e]},useSyncExternalStore:function(e,t,l){var a=be,n=At();if(_e){if(l===void 0)throw Error(c(407));l=l()}else{if(l=t(),Ve===null)throw Error(c(349));Re&127||id(a,t,l)}n.memoizedState=l;var i={value:l,getSnapshot:t};return n.queue=i,Sd(sd.bind(null,a,i,e),[e]),a.flags|=2048,Cn(9,{destroy:void 0},ud.bind(null,a,i,l,t),null),l},useId:function(){var e=At(),t=Ve.identifierPrefix;if(_e){var l=Sl,a=bl;l=(a&~(1<<32-it(a)-1)).toString(32)+l,t="_"+t+"R_"+l,l=Mu++,0<l&&(t+="H"+l.toString(32)),t+="_"}else l=Ig++,t="_"+t+"r_"+l.toString(32)+"_";return e.memoizedState=t},useHostTransitionStatus:kr,useFormState:gd,useActionState:gd,useOptimistic:function(e){var t=At();t.memoizedState=t.baseState=e;var l={pending:null,lanes:0,dispatch:null,lastRenderedReducer:null,lastRenderedState:null};return t.queue=l,t=Qr.bind(null,be,!0,l),l.dispatch=t,[e,t]},useMemoCache:Mr,useCacheRefresh:function(){return At().memoizedState=ax.bind(null,be)},useEffectEvent:function(e){var t=At(),l={impl:e};return t.memoizedState=l,function(){if(qe&2)throw Error(c(440));return l.impl.apply(void 0,arguments)}}},qd={readContext:vt,use:Uu,useCallback:Cd,useContext:vt,useEffect:Br,useImperativeHandle:Td,useInsertionEffect:_d,useLayoutEffect:jd,useMemo:zd,useReducer:Lu,useRef:bd,useState:function(){return Lu(Xl)},useDebugValue:qr,useDeferredValue:function(e,t){var l=at();return Ad(l,Xe.memoizedState,e,t)},useTransition:function(){var e=Lu(Xl)[0],t=at().memoizedState;return[typeof e=="boolean"?e:Ci(e),t]},useSyncExternalStore:nd,useId:Md,useHostTransitionStatus:kr,useFormState:xd,useActionState:xd,useOptimistic:function(e,t){var l=at();return od(l,Xe,e,t)},useMemoCache:Mr,useCacheRefresh:Dd,useEffectEvent:Nd},ix={readContext:vt,use:Uu,useCallback:Cd,useContext:vt,useEffect:Br,useImperativeHandle:Td,useInsertionEffect:_d,useLayoutEffect:jd,useMemo:zd,useReducer:Ur,useRef:bd,useState:function(){return Ur(Xl)},useDebugValue:qr,useDeferredValue:function(e,t){var l=at();return Xe===null?Yr(l,e,t):Ad(l,Xe.memoizedState,e,t)},useTransition:function(){var e=Ur(Xl)[0],t=at().memoizedState;return[typeof e=="boolean"?e:Ci(e),t]},useSyncExternalStore:nd,useId:Md,useHostTransitionStatus:kr,useFormState:yd,useActionState:yd,useOptimistic:function(e,t){var l=at();return Xe!==null?od(l,Xe,e,t):(l.baseState=e,[e,l.queue.dispatch])},useMemoCache:Mr,useCacheRefresh:Dd,useEffectEvent:Nd};function Xr(e,t,l,a){t=e.memoizedState,l=l(a,t),l=l==null?t:I({},t,l),e.memoizedState=l,e.lanes===0&&(e.updateQueue.baseState=l)}var Vr={enqueueSetState:function(e,t,l){e=e._reactInternals;var a=Kt(),n=ua(a);n.payload=t,l!=null&&(n.callback=l),t=sa(e,n,a),t!==null&&(Bt(t,e,a),Ni(t,e,a))},enqueueReplaceState:function(e,t,l){e=e._reactInternals;var a=Kt(),n=ua(a);n.tag=1,n.payload=t,l!=null&&(n.callback=l),t=sa(e,n,a),t!==null&&(Bt(t,e,a),Ni(t,e,a))},enqueueForceUpdate:function(e,t){e=e._reactInternals;var l=Kt(),a=ua(l);a.tag=2,t!=null&&(a.callback=t),t=sa(e,a,l),t!==null&&(Bt(t,e,l),Ni(t,e,l))}};function Yd(e,t,l,a,n,i,r){return e=e.stateNode,typeof e.shouldComponentUpdate=="function"?e.shouldComponentUpdate(a,i,r):t.prototype&&t.prototype.isPureReactComponent?!hi(l,a)||!hi(n,i):!0}function Gd(e,t,l,a){e=t.state,typeof t.componentWillReceiveProps=="function"&&t.componentWillReceiveProps(l,a),typeof t.UNSAFE_componentWillReceiveProps=="function"&&t.UNSAFE_componentWillReceiveProps(l,a),t.state!==e&&Vr.enqueueReplaceState(t,t.state,null)}function Ka(e,t){var l=t;if("ref"in t){l={};for(var a in t)a!=="ref"&&(l[a]=t[a])}if(e=e.defaultProps){l===t&&(l=I({},l));for(var n in e)l[n]===void 0&&(l[n]=e[n])}return l}function kd(e){hu(e)}function Qd(e){console.error(e)}function Xd(e){hu(e)}function Gu(e,t){try{var l=e.onUncaughtError;l(t.value,{componentStack:t.stack})}catch(a){setTimeout(function(){throw a})}}function Vd(e,t,l){try{var a=e.onCaughtError;a(l.value,{componentStack:l.stack,errorBoundary:t.tag===1?t.stateNode:null})}catch(n){setTimeout(function(){throw n})}}function Zr(e,t,l){return l=ua(l),l.tag=3,l.payload={element:null},l.callback=function(){Gu(e,t)},l}function Zd(e){return e=ua(e),e.tag=3,e}function Kd(e,t,l,a){var n=l.type.getDerivedStateFromError;if(typeof n=="function"){var i=a.value;e.payload=function(){return n(i)},e.callback=function(){Vd(t,l,a)}}var r=l.stateNode;r!==null&&typeof r.componentDidCatch=="function"&&(e.callback=function(){Vd(t,l,a),typeof n!="function"&&(pa===null?pa=new Set([this]):pa.add(this));var f=a.stack;this.componentDidCatch(a.value,{componentStack:f!==null?f:""})})}function ux(e,t,l,a,n){if(l.flags|=32768,a!==null&&typeof a=="object"&&typeof a.then=="function"){if(t=l.alternate,t!==null&&qa(t,l,n,!0),l=yt.current,l!==null){switch(l.tag){case 31:case 13:case 19:return Tt===null?rs():l.alternate===null&&lt===0&&(lt=3),l.flags&=-257,l.flags|=65536,l.lanes=n,a===Cu?l.flags|=16384:(t=l.updateQueue,t===null?l.updateQueue=new Set([a]):t.add(a),Rc(e,a,n)),!1;case 22:return l.flags|=65536,a===Cu?l.flags|=16384:(t=l.updateQueue,t===null?(t={transitions:null,markerInstances:null,retryQueue:new Set([a])},l.updateQueue=t):(l=t.retryQueue,l===null?t.retryQueue=new Set([a]):l.add(a)),Rc(e,a,n)),!1}throw Error(c(435,l.tag))}return Rc(e,a,n),rs(),!1}if(_e)return t=yt.current,t!==null?(!(t.flags&65536)&&(t.flags|=256),t.flags|=65536,t.lanes=n,a!==dr&&(e=Error(c(422),{cause:a}),xi(tl(e,l)))):(a!==dr&&(t=Error(c(423),{cause:a}),xi(tl(t,l))),e=e.current.alternate,e.flags|=65536,n&=-n,e.lanes|=n,a=tl(a,l),n=Zr(e.stateNode,a,n),Nr(e,n),lt!==4&&(lt=2)),!1;var i=Error(c(520),{cause:a});if(i=tl(i,l),Li===null?Li=[i]:Li.push(i),lt!==4&&(lt=2),t===null)return!0;a=tl(a,l),l=t;do{switch(l.tag){case 3:return l.flags|=65536,e=n&-n,l.lanes|=e,e=Zr(l.stateNode,a,e),Nr(l,e),!1;case 1:if(t=l.type,i=l.stateNode,!(l.flags&128)&&(typeof t.getDerivedStateFromError=="function"||i!==null&&typeof i.componentDidCatch=="function"&&(pa===null||!pa.has(i))))return l.flags|=65536,n&=-n,l.lanes|=n,n=Zd(n),Kd(n,e,l,a),Nr(l,n),!1;break;case 22:if(l.memoizedState!==null)return l.flags|=65536,!1}l=l.return}while(l!==null);return!1}var Kr=Error(c(461)),rt=!1;function ot(e,t,l,a){t.child=e===null?If(t,null,l,a):Va(t,e.child,l,a)}function Jd(e,t,l,a,n){l=l.render;var i=t.ref;if("ref"in a){var r={};for(var f in a)f!=="ref"&&(r[f]=a[f])}else r=a;return Ya(t),a=Ar(e,t,l,r,i,n),f=Rr(),e!==null&&!rt?(Or(e,t,n),Vl(e,t,n)):(_e&&f&&bu(t),t.flags|=1,ot(e,t,a,n),t.child)}function $d(e,t,l,a,n){if(e===null){var i=l.type;return typeof i=="function"&&!rr(i)&&i.defaultProps===void 0&&l.compare===null?(t.tag=15,t.type=i,Fd(e,t,i,a,n)):(e=vu(l.type,null,a,t,t.mode,n),e.ref=t.ref,e.return=t,t.child=e)}if(i=e.child,!tc(e,n)){var r=i.memoizedProps;if(l=l.compare,l=l!==null?l:hi,l(r,a)&&e.ref===t.ref)return Vl(e,t,n)}return t.flags|=1,e=ql(i,a),e.ref=t.ref,e.return=t,t.child=e}function Fd(e,t,l,a,n){if(e!==null){var i=e.memoizedProps;if(hi(i,a)&&e.ref===t.ref)if(rt=!1,t.pendingProps=a=i,tc(e,n))e.flags&131072&&(rt=!0);else return t.lanes=e.lanes,Vl(e,t,n)}return Jr(e,t,l,a,n)}function Id(e,t,l,a){var n=a.children,i=e!==null?e.memoizedState:null;if(e===null&&t.stateNode===null&&(t.stateNode={_visibility:1,_pendingMarkers:null,_retryCache:null,_transitions:null}),a.mode==="hidden"){if(t.flags&128){if(i=i!==null?i.baseLanes|l:l,e!==null){for(a=t.child=e.child,n=0;a!==null;)n=n|a.lanes|a.childLanes,a=a.sibling;a=n&~i}else a=0,t.child=null;return Wd(e,t,i,l,a)}if(l&536870912)t.memoizedState={baseLanes:0,cachePool:null},e!==null&&Eu(t,i!==null?i.cachePool:null),i!==null?ed(t,i):jr(),td(t);else return a=t.lanes=536870912,Wd(e,t,i!==null?i.baseLanes|l:l,l,a)}else i!==null?(Eu(t,i.cachePool),ed(t,i),oa(),t.memoizedState=null):(e!==null&&Eu(t,null),jr(),oa());return ot(e,t,n,l),t.child}function Ai(e,t){return e!==null&&e.tag===22||t.stateNode!==null||(t.stateNode={_visibility:1,_pendingMarkers:null,_retryCache:null,_transitions:null}),t.sibling}function Wd(e,t,l,a,n){var i=vr();return i=i===null?null:{parent:ut._currentValue,pool:i},t.memoizedState={baseLanes:l,cachePool:i},e!==null&&Eu(t,null),jr(),td(t),e!==null&&qa(e,t,a,!0),t.childLanes=n,null}function ku(e,t){return t=Qu({mode:t.mode,children:t.children},e.mode),t.ref=e.ref,e.child=t,t.return=e,t}function Pd(e,t,l){return Va(t,e.child,null,l),e=ku(t,t.pendingProps),e.flags|=2,Qt(t),t.memoizedState=null,e}function sx(e,t,l){var a=t.pendingProps,n=(t.flags&128)!==0;if(t.flags&=-129,e===null){if(_e){if(a.mode==="hidden")return e=ku(t,a),t.lanes=536870912,e.memoizedState={baseLanes:0,cachePool:null},Ai(null,e);if(Tr(t),(e=Ke)?(e=Eh(e,nl),e=e!==null&&e.data==="&"?e:null,e!==null&&(t.memoizedState={dehydrated:e,treeContext:ea!==null?{id:bl,overflow:Sl}:null,retryLane:536870912,hydrationErrors:null},l=Lf(e),l.return=t,t.child=l,mt=t,Ke=null)):e=null,e===null)throw la(t);return t.lanes=536870912,null}return ku(t,a)}var i=e.memoizedState;if(i!==null){var r=i.dehydrated;if(Tr(t),n)if(t.flags&256)t.flags&=-257,t=Pd(e,t,l);else if(t.memoizedState!==null)t.child=e.child,t.flags|=128,t=null;else throw Error(c(558));else if(rt||qa(e,t,l,!1),n=(l&e.childLanes)!==0,rt||n){if(ra.current===null){if(a=Ve,a!==null&&(r=Bo(a,l),r!==0&&r!==i.retryLane))throw i.retryLane=r,Ua(e,r),Bt(a,e,r),Kr;rs()}t=Pd(e,t,l)}else e=i.treeContext,Ke=ul(r.nextSibling),mt=t,_e=!0,ta=null,nl=!1,e!==null&&qf(t,e),t=ku(t,a),t.flags|=134221824;return t}return e=ql(e.child,{mode:a.mode,children:a.children}),e.ref=t.ref,t.child=e,e.return=t,e}function zn(e,t){var l=t.ref;if(l===null)e!==null&&e.ref!==null&&(t.flags|=4194816);else{if(typeof l!="function"&&typeof l!="object")throw Error(c(284));(e===null||e.ref!==l)&&(t.flags|=4194816)}}function Jr(e,t,l,a,n){return Ya(t),l=Ar(e,t,l,a,void 0,n),a=Rr(),e!==null&&!rt?(Or(e,t,n),Vl(e,t,n)):(_e&&a&&bu(t),t.flags|=1,ot(e,t,l,n),t.child)}function em(e,t,l,a,n,i){return Ya(t),t.updateQueue=null,l=ad(t,a,l,n),ld(e),a=Rr(),e!==null&&!rt?(Or(e,t,i),Vl(e,t,i)):(_e&&a&&bu(t),t.flags|=1,ot(e,t,l,i),t.child)}function tm(e,t,l,a,n){if(Ya(t),t.stateNode===null){var i=vn,r=l.contextType;typeof r=="object"&&r!==null&&(i=vt(r)),i=new l(a,i),t.memoizedState=i.state!==null&&i.state!==void 0?i.state:null,i.updater=Vr,t.stateNode=i,i._reactInternals=t,i=t.stateNode,i.props=a,i.state=t.memoizedState,i.refs={},br(t),r=l.contextType,i.context=typeof r=="object"&&r!==null?vt(r):vn,i.state=t.memoizedState,r=l.getDerivedStateFromProps,typeof r=="function"&&(Xr(t,l,r,a),i.state=t.memoizedState),typeof l.getDerivedStateFromProps=="function"||typeof i.getSnapshotBeforeUpdate=="function"||typeof i.UNSAFE_componentWillMount!="function"&&typeof i.componentWillMount!="function"||(r=i.state,typeof i.componentWillMount=="function"&&i.componentWillMount(),typeof i.UNSAFE_componentWillMount=="function"&&i.UNSAFE_componentWillMount(),r!==i.state&&Vr.enqueueReplaceState(i,i.state,null),ji(t,a,i,n),_i(),i.state=t.memoizedState),typeof i.componentDidMount=="function"&&(t.flags|=4194308),a=!0}else if(e===null){i=t.stateNode;var f=t.memoizedProps,x=Ka(l,f);i.props=x;var E=i.context,w=l.contextType;r=vn,typeof w=="object"&&w!==null&&(r=vt(w));var H=l.getDerivedStateFromProps;w=typeof H=="function"||typeof i.getSnapshotBeforeUpdate=="function",f=t.pendingProps!==f,w||typeof i.UNSAFE_componentWillReceiveProps!="function"&&typeof i.componentWillReceiveProps!="function"||(f||E!==r)&&Gd(t,i,a,r),ia=!1;var _=t.memoizedState;i.state=_,ji(t,a,i,n),_i(),E=t.memoizedState,f||_!==E||ia?(typeof H=="function"&&(Xr(t,l,H,a),E=t.memoizedState),(x=ia||Yd(t,l,x,a,_,E,r))?(w||typeof i.UNSAFE_componentWillMount!="function"&&typeof i.componentWillMount!="function"||(typeof i.componentWillMount=="function"&&i.componentWillMount(),typeof i.UNSAFE_componentWillMount=="function"&&i.UNSAFE_componentWillMount()),typeof i.componentDidMount=="function"&&(t.flags|=4194308)):(typeof i.componentDidMount=="function"&&(t.flags|=4194308),t.memoizedProps=a,t.memoizedState=E),i.props=a,i.state=E,i.context=r,a=x):(typeof i.componentDidMount=="function"&&(t.flags|=4194308),a=!1)}else{i=t.stateNode,Sr(e,t),r=t.memoizedProps,w=Ka(l,r),i.props=w,H=t.pendingProps,_=i.context,E=l.contextType,x=vn,typeof E=="object"&&E!==null&&(x=vt(E)),f=l.getDerivedStateFromProps,(E=typeof f=="function"||typeof i.getSnapshotBeforeUpdate=="function")||typeof i.UNSAFE_componentWillReceiveProps!="function"&&typeof i.componentWillReceiveProps!="function"||(r!==H||_!==x)&&Gd(t,i,a,x),ia=!1,_=t.memoizedState,i.state=_,ji(t,a,i,n),_i();var O=t.memoizedState;r!==H||_!==O||ia||e!==null&&e.dependencies!==null&&_u(e.dependencies)?(typeof f=="function"&&(Xr(t,l,f,a),O=t.memoizedState),(w=ia||Yd(t,l,w,a,_,O,x)||e!==null&&e.dependencies!==null&&_u(e.dependencies))?(E||typeof i.UNSAFE_componentWillUpdate!="function"&&typeof i.componentWillUpdate!="function"||(typeof i.componentWillUpdate=="function"&&i.componentWillUpdate(a,O,x),typeof i.UNSAFE_componentWillUpdate=="function"&&i.UNSAFE_componentWillUpdate(a,O,x)),typeof i.componentDidUpdate=="function"&&(t.flags|=4),typeof i.getSnapshotBeforeUpdate=="function"&&(t.flags|=1024)):(typeof i.componentDidUpdate!="function"||r===e.memoizedProps&&_===e.memoizedState||(t.flags|=4),typeof i.getSnapshotBeforeUpdate!="function"||r===e.memoizedProps&&_===e.memoizedState||(t.flags|=1024),t.memoizedProps=a,t.memoizedState=O),i.props=a,i.state=O,i.context=x,a=w):(typeof i.componentDidUpdate!="function"||r===e.memoizedProps&&_===e.memoizedState||(t.flags|=4),typeof i.getSnapshotBeforeUpdate!="function"||r===e.memoizedProps&&_===e.memoizedState||(t.flags|=1024),a=!1)}return i=a,zn(e,t),a=(t.flags&128)!==0,i||a?(i=t.stateNode,l=a&&typeof l.getDerivedStateFromError!="function"?null:i.render(),t.flags|=1,e!==null&&a?(t.child=Va(t,e.child,null,n),t.child=Va(t,null,l,n)):ot(e,t,l,n),t.memoizedState=i.state,e=t.child):e=Vl(e,t,n),e}function lm(e,t,l,a){return Ha(),t.flags|=256,ot(e,t,l,a),t.child}var $r={dehydrated:null,treeContext:null,retryLane:0,hydrationErrors:null};function Fr(e){return{baseLanes:e,cachePool:Vf()}}function Ir(e,t,l){return e=e!==null?e.childLanes&~l:0,t&&(e|=Zt),e}function am(e,t,l){var a=t.pendingProps,n=!1,i=(t.flags&128)!==0,r;if((r=i)||(r=e!==null&&e.memoizedState===null?!1:(bt.current&2)!==0),r&&(n=!0,t.flags&=-129),r=(t.flags&32)!==0,t.flags&=-33,e===null){if(_e){if(n?ca(t):oa(),(e=Ke)?(e=Eh(e,nl),e=e!==null&&e.data!=="&"?e:null,e!==null&&(t.memoizedState={dehydrated:e,treeContext:ea!==null?{id:bl,overflow:Sl}:null,retryLane:536870912,hydrationErrors:null},l=Lf(e),l.return=t,t.child=l,mt=t,Ke=null)):e=null,e===null)throw la(t);return Fc(e)?t.lanes=32:t.lanes=536870912,null}return i=a.children,a=a.fallback,n?(oa(),n=t.mode,i=Qu({mode:"hidden",children:i},n),a=La(a,n,l,null),i.return=t,a.return=t,i.sibling=a,t.child=i,a=t.child,a.memoizedState=Fr(l),a.childLanes=Ir(e,r,l),t.memoizedState=$r,Ai(null,a)):(ca(t),Wr(t,i))}var f=e.memoizedState;if(f!==null){var x=f.dehydrated;if(x!==null)return rx(e,t,i,r,a,x,f,l)}return n?(oa(),n=a.fallback,i=t.mode,f=e.child,x=f.sibling,a=ql(f,{mode:"hidden",children:a.children}),a.subtreeFlags=f.subtreeFlags&1206910976,x!==null?n=ql(x,n):(n=La(n,i,l,null),n.flags|=2),n.return=t,a.return=t,a.sibling=n,t.child=a,Ai(null,a),a=t.child,n=e.child.memoizedState,n===null?n=Fr(l):(i=n.cachePool,i!==null?(f=ut._currentValue,i=i.parent!==f?{parent:f,pool:f}:i):i=Vf(),n={baseLanes:n.baseLanes|l,cachePool:i}),a.memoizedState=n,a.childLanes=Ir(e,r,l),t.memoizedState=$r,Ai(e.child,a)):(ca(t),l=e.child,e=l.sibling,l=ql(l,{mode:"visible",children:a.children}),l.return=t,l.sibling=null,e!==null&&(r=t.deletions,r===null?(t.deletions=[e],t.flags|=16):r.push(e)),t.child=l,t.memoizedState=null,l)}function Wr(e,t){return t=Qu({mode:"visible",children:t},e.mode),t.return=e,e.child=t}function Qu(e,t){return e=Dt(22,e,null,t),e.lanes=0,e}function Xu(e,t,l){return Va(t,e.child,null,l),e=Wr(t,t.pendingProps.children),e.flags|=2,t.memoizedState=null,e}function rx(e,t,l,a,n,i,r,f){if(l)return t.flags&256?(ca(t),t.flags&=-257,Xu(e,t,f)):t.memoizedState!==null?(oa(),t.child=e.child,t.flags|=128,null):(oa(),i=n.fallback,r=t.mode,n=Qu({mode:"visible",children:n.children},r),i=La(i,r,f,null),i.flags|=2,n.return=t,i.return=t,n.sibling=i,t.child=n,Va(t,e.child,null,f),n=t.child,n.memoizedState=Fr(f),n.childLanes=Ir(e,a,f),t.memoizedState=$r,Ai(null,n));if(ca(t),Fc(i)){if(a=i.nextSibling&&i.nextSibling.dataset,a)var x=a.dgst;return a=x,a!==""&&(n=Error(c(419)),n.stack="",n.digest=a,xi({value:n,source:null,stack:null})),Xu(e,t,f)}if(rt||qa(e,t,f,!1),a=(f&e.childLanes)!==0,rt||a){if(ra.current!==null)return Xu(e,t,f);if(a=Ve,a!==null&&(n=Bo(a,f),n!==0&&n!==r.retryLane))throw r.retryLane=n,Ua(e,n),Bt(a,e,n),Kr;return $c(i)||rs(),Xu(e,t,f)}return $c(i)?(t.flags|=192,t.child=e.child,null):(e=r.treeContext,Ke=ul(i.nextSibling),mt=t,_e=!0,ta=null,nl=!1,e!==null&&qf(t,e),t=Wr(t,n.children),t.flags|=134221824,t)}function nm(e,t,l){e.lanes|=t;var a=e.alternate;a!==null&&(a.lanes|=t),Nu(e.return,t,l)}function im(e){for(var t=null;e!==null;){var l=e.alternate;l!==null&&Ou(l)===null&&(t=e),e=e.sibling}return t}function Vu(e,t,l,a,n,i){var r=e.memoizedState;r===null?e.memoizedState={isBackwards:t,rendering:null,renderingStartTime:0,last:a,tail:l,tailMode:n,treeForkCount:i}:(r.isBackwards=t,r.rendering=null,r.renderingStartTime=0,r.last=a,r.tail=l,r.tailMode=n,r.treeForkCount=i)}function Pr(e){var t=e.child;for(e.child=null;t!==null;){var l=t.sibling;t.sibling=e.child,e.child=t,t=l}}function ec(e,t,l){var a=t.pendingProps,n=a.revealOrder,i=a.tail;a=a.children;var r=bt.current;if(t.flags&128)return Ei(t,r),null;var f=(r&2)!==0;if(f?(r=r&1|2,t.flags|=128):r&=1,Ei(t,r),n==="backwards"&&e!==null?(Pr(e),ot(e,t,a,l),Pr(e)):ot(e,t,a,l),a=_e?gi:0,!f&&e!==null&&e.flags&128)e:for(e=t.child;e!==null;){if(e.tag===13)e.memoizedState!==null&&nm(e,l,t);else if(e.tag===19)nm(e,l,t);else if(e.child!==null){e.child.return=e,e=e.child;continue}if(e===t)break e;for(;e.sibling===null;){if(e.return===null||e.return===t)break e;e=e.return}e.sibling.return=e.return,e=e.sibling}switch(n){case"backwards":l=im(t.child),l===null?(n=t.child,t.child=null):(n=l.sibling,l.sibling=null,Pr(t)),Vu(t,!0,n,null,i,a);break;case"unstable_legacy-backwards":for(l=null,n=t.child,t.child=null;n!==null;){if(e=n.alternate,e!==null&&Ou(e)===null){t.child=n;break}e=n.sibling,n.sibling=l,l=n,n=e}Vu(t,!0,l,null,i,a);break;case"together":Vu(t,!1,null,null,void 0,a);break;case"independent":t.memoizedState=null;break;default:l=im(t.child),l===null?(n=t.child,t.child=null):(n=l.sibling,l.sibling=null),Vu(t,!1,n,l,i,a)}return t.child}function um(e,t,l){var a=t.pendingProps;return aa(t,t.type,a.value),ot(e,t,a.children,l),t.child}function Vl(e,t,l){if(e!==null&&(t.dependencies=e.dependencies),ha|=t.lanes,!(l&t.childLanes))if(e!==null){if(qa(e,t,l,!1),(l&t.childLanes)===0)return null}else return null;if(e!==null&&t.child!==e.child)throw Error(c(153));if(t.child!==null){for(e=t.child,l=ql(e,e.pendingProps),t.child=l,l.return=t;e.sibling!==null;)e=e.sibling,l=l.sibling=ql(e,e.pendingProps),l.return=t;l.sibling=null}return t.child}function tc(e,t){return e.lanes&t?!0:(e=e.dependencies,!!(e!==null&&_u(e)))}function cx(e,t,l){switch(t.tag){case 3:vl(t,t.stateNode.containerInfo),aa(t,ut,e.memoizedState.cache),Ha();break;case 27:case 5:en(t);break;case 4:vl(t,t.stateNode.containerInfo);break;case 10:aa(t,t.type,t.memoizedProps.value);break;case 31:if(t.memoizedState!==null)return t.flags|=128,Tr(t),null;break;case 13:var a=t.memoizedState;if(a!==null){if(a.dehydrated!==null)return ca(t),t.flags|=128,null;a=qa(e,t,l,!1);var n=t.child.childLanes;return a||l&n?am(e,t,l):(ca(t),e=Vl(e,t,l),e!==null?e.sibling:null)}ca(t);break;case 19:if(t.flags&128)return ec(e,t,l);if(n=(e.flags&128)!==0,a=(l&t.childLanes)!==0,a||(qa(e,t,l,!1),a=(l&t.childLanes)!==0),n){if(a)return ec(e,t,l);t.flags|=128}if(n=t.memoizedState,n!==null&&(n.rendering=null,n.tail=null,n.lastEffect=null),Ei(t,bt.current),a)break;return null;case 22:return t.lanes=0,Id(e,t,l,t.pendingProps);case 24:aa(t,ut,e.memoizedState.cache)}return Vl(e,t,l)}function sm(e,t,l){if(e!==null)if(e.memoizedProps!==t.pendingProps)rt=!0;else{if(!tc(e,l)&&!(t.flags&128))return rt=!1,cx(e,t,l);rt=!!(e.flags&131072)}else rt=!1,_e&&t.flags&1048576&&Bf(t,gi,t.index);switch(t.lanes=0,t.tag){case 16:e:{var a=t.pendingProps;if(e=Qa(t.elementType),t.type=e,typeof e=="function")rr(e)?(a=Ka(e,a),t.tag=1,t=tm(null,t,e,a,l)):(t.tag=0,t=Jr(null,t,e,a,l));else{if(e!=null){var n=e.$$typeof;if(n===K){t.tag=11,t=Jd(null,t,e,a,l);break e}else if(n===ze){t.tag=14,t=$d(null,t,e,a,l);break e}else if(n===je){t.tag=10,t.type=e,t=um(null,t,l);break e}}throw t=se(e)||e,Error(c(306,t,""))}}return t;case 0:return Jr(e,t,t.type,t.pendingProps,l);case 1:return a=t.type,n=Ka(a,t.pendingProps),tm(e,t,a,n,l);case 3:e:{if(vl(t,t.stateNode.containerInfo),e===null)throw Error(c(387));a=t.pendingProps;var i=t.memoizedState;n=i.element,Sr(e,t),ji(t,a,null,l);var r=t.memoizedState;if(a=r.cache,aa(t,ut,a),a!==i.cache&&pr(t,[ut],l,!0),_i(),a=r.element,i.isDehydrated)if(i={element:a,isDehydrated:!1,cache:r.cache},t.updateQueue.baseState=i,t.memoizedState=i,t.flags&256){t=lm(e,t,a,l);break e}else if(a!==n){n=tl(Error(c(424)),t),xi(n),t=lm(e,t,a,l);break e}else{switch(e=t.stateNode.containerInfo,e.nodeType){case 9:e=e.body;break;default:e=e.nodeName==="HTML"?e.ownerDocument.body:e}for(Ke=ul(e.firstChild),mt=t,_e=!0,ta=null,nl=!0,l=If(t,null,a,l),t.child=l;l;)l.flags=l.flags&-3|134221824,l=l.sibling}else{if(Ha(),a===n){t=Vl(e,t,l);break e}ot(e,t,a,l)}t=t.child}return t;case 26:return zn(e,t),e===null?(l=wh(t.type,null,t.pendingProps,null))?t.memoizedState=l:_e||(t.stateNode=fh(t.type,t.pendingProps,It.current,t)):t.memoizedState=wh(t.type,e.memoizedProps,t.pendingProps,e.memoizedState),null;case 27:return en(t),e===null&&_e&&(a=t.stateNode=zh(t.type,t.pendingProps,It.current),mt=t,nl=!0,n=Ke,va(t.type)?(Ic=n,Ke=ul(a.firstChild)):Ke=n),ot(e,t,t.pendingProps.children,l),zn(e,t),e===null&&(t.flags|=4194304),t.child;case 5:return e===null&&_e&&((n=a=Ke)&&(a=av(a,t.type,t.pendingProps,nl),a!==null?(t.stateNode=a,mt=t,Ke=ul(a.firstChild),nl=!1,n=!0):n=!1),n||la(t)),en(t),n=t.type,i=t.pendingProps,r=e!==null?e.memoizedProps:null,a=i.children,kc(n,i)?a=null:r!==null&&kc(n,r)&&(t.flags|=32),t.memoizedState!==null&&(n=Ar(e,t,Wg,null,null,l),Zn._currentValue=n),zn(e,t),ot(e,t,a,l),t.child;case 6:return e===null&&_e&&((e=l=Ke)&&(l=nv(l,t.pendingProps,nl),l!==null?(t.stateNode=l,mt=t,Ke=null,e=!0):e=!1),e||la(t)),null;case 13:return am(e,t,l);case 4:return vl(t,t.stateNode.containerInfo),a=t.pendingProps,e===null?t.child=Va(t,null,a,l):ot(e,t,a,l),t.child;case 11:return Jd(e,t,t.type,t.pendingProps,l);case 7:return a=t.pendingProps,zn(e,t),ot(e,t,a,l),t.child;case 8:return ot(e,t,t.pendingProps.children,l),t.child;case 12:return ot(e,t,t.pendingProps.children,l),t.child;case 10:return um(e,t,l);case 9:return n=t.type._context,a=t.pendingProps.children,Ya(t),n=vt(n),a=a(n),t.flags|=1,ot(e,t,a,l),t.child;case 14:return $d(e,t,t.type,t.pendingProps,l);case 15:return Fd(e,t,t.type,t.pendingProps,l);case 19:return ec(e,t,l);case 31:return sx(e,t,l);case 22:return Id(e,t,l,t.pendingProps);case 24:return Ya(t),a=vt(ut),e===null?(n=vr(),n===null&&(n=Ve,i=gr(),n.pooledCache=i,i.refCount++,i!==null&&(n.pooledCacheLanes|=l),n=i),t.memoizedState={parent:a,cache:n},br(t),aa(t,ut,n)):(e.lanes&l&&(Sr(e,t),ji(t,null,null,l),_i()),n=e.memoizedState,i=t.memoizedState,n.parent!==a?(n={parent:a,cache:a},t.memoizedState=n,t.lanes===0&&(t.memoizedState=t.updateQueue.baseState=n),aa(t,ut,a)):(a=i.cache,aa(t,ut,a),a!==n.cache&&pr(t,[ut],l,!0))),ot(e,t,t.pendingProps.children,l),t.child;case 30:return t.stateNode===null&&(t.stateNode={autoName:null,paired:null,clones:null,ref:null}),a=t.pendingProps,a.name!=null&&a.name!=="auto"?t.flags|=e===null?18882560:18874368:_e&&bu(t),e!==null&&e.memoizedProps.name!==a.name?t.flags|=4194816:zn(e,t),ot(e,t,a.children,l),t.child;case 29:throw t.pendingProps}throw Error(c(156,t.tag))}function Zl(e){e.flags|=4}function lc(e,t,l,a,n){var i;if((i=(e.mode&32)!==0)&&(i=l===null?Lh(t,a):Lh(t,a)&&(a.src!==l.src||a.srcSet!==l.srcSet)),i){if(e.flags|=16777216,(n&335544128)===n)if(e.stateNode.complete)e.flags|=8192;else if(km())e.flags|=8192;else throw Xa=Cu,yr}else e.flags&=-16777217}function rm(e,t){if(t.type!=="stylesheet"||t.state.loading&4)e.flags&=-16777217;else if(e.flags|=16777216,!Hh(t))if(km())e.flags|=8192;else throw Xa=Cu,yr}function Zu(e,t){t!==null&&(e.flags|=4),e.flags&16384&&(t=e.tag!==22?Uo():536870912,e.lanes|=t,Mn|=t)}function Ri(e,t){if(!_e)switch(e.tailMode){case"visible":break;case"collapsed":for(var l=e.tail,a=null;l!==null;)l.alternate!==null&&(a=l),l=l.sibling;a===null?t||e.tail===null?e.tail=null:e.tail.sibling=null:a.sibling=null;break;default:for(t=e.tail,l=null;t!==null;)t.alternate!==null&&(l=t),t=t.sibling;l===null?e.tail=null:l.sibling=null}}function Je(e){var t=e.alternate!==null&&e.alternate.child===e.child,l=0,a=0;if(t)for(var n=e.child;n!==null;)l|=n.lanes|n.childLanes,a|=n.subtreeFlags&1206910976,a|=n.flags&1206910976,n.return=e,n=n.sibling;else for(n=e.child;n!==null;)l|=n.lanes|n.childLanes,a|=n.subtreeFlags,a|=n.flags,n.return=e,n=n.sibling;return e.subtreeFlags|=a,e.childLanes=l,t}function ox(e,t,l){var a=t.pendingProps;switch(fr(t),t.tag){case 16:case 15:case 0:case 11:case 7:case 8:case 12:case 9:case 14:return Je(t),null;case 1:return Je(t),null;case 3:return l=t.stateNode,a=null,e!==null&&(a=e.memoizedState.cache),t.memoizedState.cache!==a&&(t.flags|=2048),kl(ut),Ml(),l.pendingContext&&(l.context=l.pendingContext,l.pendingContext=null),(e===null||e.child===null)&&(Sn(t)?Zl(t):e===null||e.memoizedState.isDehydrated&&!(t.flags&256)||(t.flags|=1024,mr())),Je(t),null;case 26:var n=t.type,i=t.memoizedState;return e===null?(Zl(t),i!==null?(Je(t),rm(t,i)):(Je(t),lc(t,n,null,a,l))):i?i!==e.memoizedState?(Zl(t),Je(t),rm(t,i)):(Je(t),t.flags&=-16777217):(e=e.memoizedProps,e!==a&&Zl(t),Je(t),lc(t,n,e,a,l)),null;case 27:if(Fl(t),l=It.current,n=t.type,e!==null&&t.stateNode!=null)e.memoizedProps!==a&&Zl(t);else{if(!a){if(t.stateNode===null)throw Error(c(166));return Je(t),t.subtreeFlags&=-33554433,null}e=Ft.current,Sn(t)?Yf(t):(e=zh(n,a,l),t.stateNode=e,Zl(t))}return Je(t),t.subtreeFlags&=-33554433,null;case 5:if(Fl(t),n=t.type,e!==null&&t.stateNode!=null)e.memoizedProps!==a&&Zl(t);else{if(!a){if(t.stateNode===null)throw Error(c(166));return Je(t),t.subtreeFlags&=-33554433,null}if(i=Ft.current,Sn(t))Yf(t);else{var r=Gi(It.current);switch(i){case 1:i=r.createElementNS("http://www.w3.org/2000/svg",n);break;case 2:i=r.createElementNS("http://www.w3.org/1998/Math/MathML",n);break;default:switch(n){case"svg":i=r.createElementNS("http://www.w3.org/2000/svg",n);break;case"math":i=r.createElementNS("http://www.w3.org/1998/Math/MathML",n);break;case"script":i=r.createElement("div"),i.innerHTML="<script><\/script>",i=i.removeChild(i.firstChild);break;case"select":i=typeof a.is=="string"?r.createElement("select",{is:a.is}):r.createElement("select"),a.multiple?i.multiple=!0:a.size&&(i.size=a.size);break;default:i=typeof a.is=="string"?r.createElement(n,{is:a.is}):r.createElement(n)}}i[xt]=t,i[Mt]=a;e:for(r=t.child;r!==null;){if(r.tag===5||r.tag===6)i.appendChild(r.stateNode);else if(r.tag!==4&&r.tag!==27&&r.child!==null){r.child.return=r,r=r.child;continue}if(r===t)break e;for(;r.sibling===null;){if(r.return===null||r.return===t)break e;r=r.return}r.sibling.return=r.return,r=r.sibling}t.stateNode=i;e:switch(Nt(i,n,a),n){case"button":case"input":case"select":case"textarea":a=!!a.autoFocus;break e;case"img":a=!0;break e;default:a=!1}a&&Zl(t)}}return Je(t),t.subtreeFlags&=-33554433,lc(t,t.type,e===null?null:e.memoizedProps,t.pendingProps,l),null;case 6:if(e&&t.stateNode!=null)e.memoizedProps!==a&&Zl(t);else{if(typeof a!="string"&&t.stateNode===null)throw Error(c(166));if(e=It.current,Sn(t)){if(e=t.stateNode,l=t.memoizedProps,a=null,n=mt,n!==null)switch(n.tag){case 27:case 5:a=n.memoizedProps}e[xt]=t,e=!!(e.nodeValue===l||a!==null&&a.suppressHydrationWarning===!0||sh(e.nodeValue,l)),e||la(t,!0)}else e=Gi(e).createTextNode(a),e[xt]=t,t.stateNode=e}return Je(t),null;case 31:if(l=t.memoizedState,e===null||e.memoizedState!==null){if(a=Sn(t),l!==null){if(e===null){if(!a)throw Error(c(318));if(e=t.memoizedState,e=e!==null?e.dehydrated:null,!e)throw Error(c(557));e[xt]=t}else Ha(),!(t.flags&128)&&(t.memoizedState=null),t.flags|=4;Je(t),e=!1}else l=mr(),e!==null&&e.memoizedState!==null&&(e.memoizedState.hydrationErrors=l),e=!0;if(!e)return t.flags&256?(Qt(t),t):(Qt(t),null);if(t.flags&128)throw Error(c(558))}return Je(t),null;case 13:if(a=t.memoizedState,e===null||e.memoizedState!==null&&e.memoizedState.dehydrated!==null){if(n=Sn(t),a!==null&&a.dehydrated!==null){if(e===null){if(!n)throw Error(c(318));if(n=t.memoizedState,n=n!==null?n.dehydrated:null,!n)throw Error(c(317));n[xt]=t}else Ha(),!(t.flags&128)&&(t.memoizedState=null),t.flags|=4;Je(t),n=!1}else n=mr(),e!==null&&e.memoizedState!==null&&(e.memoizedState.hydrationErrors=n),n=!0;if(!n)return t.flags&256?(Qt(t),t):(Qt(t),null)}return Qt(t),t.flags&128?(t.lanes=l,t):(l=a!==null,e=e!==null&&e.memoizedState!==null,l&&(a=t.child,n=null,a.alternate!==null&&a.alternate.memoizedState!==null&&a.alternate.memoizedState.cachePool!==null&&(n=a.alternate.memoizedState.cachePool.pool),i=null,a.memoizedState!==null&&a.memoizedState.cachePool!==null&&(i=a.memoizedState.cachePool.pool),i!==n&&(a.flags|=2048)),l!==e&&l&&(t.child.flags|=8192),Zu(t,t.updateQueue),Je(t),null);case 4:return Ml(),e===null&&Hc(t.stateNode.containerInfo),t.flags|=67108864,Je(t),null;case 10:return kl(t.type),Je(t),null;case 19:if(Cr(t),a=t.memoizedState,a===null)return Je(t),null;if(n=(t.flags&128)!==0,i=a.rendering,i===null)if(n)Ri(a,!1);else{if(lt!==0||e!==null&&e.flags&128)for(e=t.child;e!==null;){if(i=Ou(e),i!==null){for(t.flags|=128,Ri(a,!1),e=i.updateQueue,t.updateQueue=e,Zu(t,e),t.subtreeFlags=0,e=l,l=t.child;l!==null;)Uf(l,e),l=l.sibling;return Ei(t,bt.current&1|2),_e&&Yl(t,a.treeForkCount),t.child}e=e.sibling}a.tail!==null&&M()>ns&&(t.flags|=128,n=!0,Ri(a,!1),t.lanes=4194304)}else{if(!n)if(e=Ou(i),e!==null){if(t.flags|=128,n=!0,e=e.updateQueue,t.updateQueue=e,Zu(t,e),Ri(a,!0),a.tail===null&&a.tailMode!=="collapsed"&&a.tailMode!=="visible"&&!i.alternate&&!_e)return Je(t),null}else 2*M()-a.renderingStartTime>ns&&l!==536870912&&(t.flags|=128,n=!0,Ri(a,!1),t.lanes=4194304);a.isBackwards?(i.sibling=t.child,t.child=i):(e=a.last,e!==null?e.sibling=i:t.child=i,a.last=i)}if(a.tail!==null){e=a.tail;e:{for(l=e;l!==null;){if(l.alternate!==null){l=!1;break e}l=l.sibling}l=!0}return a.rendering=e,a.tail=e.sibling,a.renderingStartTime=M(),e.sibling=null,i=bt.current,i=n?i&1|2:i&1,a.tailMode==="visible"||a.tailMode==="collapsed"||!l||_e?Ei(t,i):(l=i,De(yt,t),De(bt,l),Tt===null&&(Tt=t)),_e&&Yl(t,a.treeForkCount),e}return Je(t),null;case 22:case 23:return Qt(t),Er(),a=t.memoizedState!==null,e!==null?e.memoizedState!==null!==a&&(t.flags|=8192):a&&(t.flags|=8192),a?l&536870912&&!(t.flags&128)&&(Je(t),t.subtreeFlags&6&&(t.flags|=8192)):Je(t),l=t.updateQueue,l!==null&&Zu(t,l.retryQueue),l=null,e!==null&&e.memoizedState!==null&&e.memoizedState.cachePool!==null&&(l=e.memoizedState.cachePool.pool),a=null,t.memoizedState!==null&&t.memoizedState.cachePool!==null&&(a=t.memoizedState.cachePool.pool),a!==l&&(t.flags|=2048),e!==null&&Ie(ka),null;case 24:return l=null,e!==null&&(l=e.memoizedState.cache),t.memoizedState.cache!==l&&(t.flags|=2048),kl(ut),Je(t),null;case 25:return null;case 30:return t.flags|=33554432,Je(t),null}throw Error(c(156,t.tag))}function fx(e,t){switch(fr(t),t.tag){case 1:return e=t.flags,e&65536?(t.flags=e&-65537|128,t):null;case 3:return kl(ut),Ml(),e=t.flags,e&65536&&!(e&128)?(t.flags=e&-65537|128,t):null;case 26:case 27:case 5:return Fl(t),null;case 31:if(t.memoizedState!==null){if(Qt(t),t.alternate===null)throw Error(c(340));Ha()}return e=t.flags,e&65536?(t.flags=e&-65537|128,t):null;case 13:if(Qt(t),e=t.memoizedState,e!==null&&e.dehydrated!==null){if(t.alternate===null)throw Error(c(340));Ha()}return e=t.flags,e&65536?(t.flags=e&-65537|128,t):null;case 19:return Cr(t),e=t.flags,e&65536?(t.flags=e&-65537|128,e=t.memoizedState,e!==null&&(e.rendering=null,e.tail=null),t.flags|=4,t):null;case 4:return Ml(),null;case 10:return kl(t.type),null;case 22:case 23:return Qt(t),Er(),e!==null&&Ie(ka),e=t.flags,e&65536?(t.flags=e&-65537|128,t):null;case 24:return kl(ut),null;case 25:return null;default:return null}}function cm(e,t){switch(fr(t),t.tag){case 3:kl(ut),Ml();break;case 26:case 27:case 5:Fl(t);break;case 4:Ml();break;case 31:t.memoizedState!==null&&Qt(t);break;case 13:Qt(t);break;case 19:Cr(t);break;case 10:kl(t.type);break;case 22:case 23:Qt(t),Er(),e!==null&&Ie(ka);break;case 24:kl(ut)}}function Oi(e,t){try{var l=t.updateQueue,a=l!==null?l.lastEffect:null;if(a!==null){var n=a.next;l=n;do{if((l.tag&e)===e){a=void 0;var i=l.create,r=l.inst;a=i(),r.destroy=a}l=l.next}while(l!==n)}}catch(f){ke(t,t.return,f)}}function fa(e,t,l){try{var a=t.updateQueue,n=a!==null?a.lastEffect:null;if(n!==null){var i=n.next;a=i;do{if((a.tag&e)===e){var r=a.inst,f=r.destroy;if(f!==void 0){r.destroy=void 0,n=t;var x=l,E=f;try{E()}catch(w){ke(n,x,w)}}}a=a.next}while(a!==i)}}catch(w){ke(t,t.return,w)}}function om(e){var t=e.updateQueue;if(t!==null){var l=e.stateNode;try{Pf(t,l)}catch(a){ke(e,e.return,a)}}}function fm(e,t,l){l.props=Ka(e.type,e.memoizedProps),l.state=e.memoizedState;try{l.componentWillUnmount()}catch(a){ke(e,t,a)}}function Nl(e,t){try{var l=e.ref;if(l!==null){switch(e.tag){case 26:case 27:case 5:var a=e.stateNode;break;case 30:var n=e.stateNode,i=Hl(e.memoizedProps,n);(n.ref===null||n.ref.name!==i)&&(n.ref=vh(i)),a=n.ref;break;case 7:if(e.stateNode===null){var r=new Jt(e);g(e.child,!1,tv,r,void 0,void 0),e.stateNode=r}a=e.stateNode;break;default:a=e.stateNode}typeof l=="function"?e.refCleanup=l(a):l.current=a}}catch(f){ke(e,t,f)}}function St(e,t){var l=e.ref,a=e.refCleanup;if(l!==null)if(typeof a=="function")try{a()}catch(n){ke(e,t,n)}finally{e.refCleanup=null,e=e.alternate,e!=null&&(e.refCleanup=null)}else if(typeof l=="function")try{l(null)}catch(n){ke(e,t,n)}else l.current=null}function Ku(e,t){if((e.tag===5||e.tag===27||e.tag===6)&&e.alternate===null&&t!==null)for(var l=0;l<t.length;l++)jh(e.stateNode,t[l])}function dm(e){for(var t=e.return;t!==null&&(nc(t)&&jh(e.stateNode,t.stateNode),!ac(t));)t=t.return}function wi(e){for(var t=e.return;t!==null&&(nc(t)&&lv(e.stateNode,t.stateNode),!ac(t));)t=t.return}function ac(e){return e.tag===5||e.tag===3||e.tag===27}function nc(e){return e&&e.tag===7&&e.stateNode!==null}function ic(e){var t=e.type,l=e.memoizedProps,a=e.stateNode;try{e:switch(t){case"button":case"input":case"select":case"textarea":l.autoFocus&&a.focus();break e;case"img":l.src?a.src=l.src:l.srcSet&&(a.srcset=l.srcSet)}}catch(n){ke(e,e.return,n)}}function uc(e,t,l){try{var a=e.stateNode;Hx(a,e.type,l,t),a[Mt]=t}catch(n){ke(e,e.return,n)}}function mm(e){return e.tag===5||e.tag===3||e.tag===26||e.tag===27&&va(e.type)||e.tag===4}function sc(e){e:for(;;){for(;e.sibling===null;){if(e.return===null||mm(e.return))return null;e=e.return}for(e.sibling.return=e.return,e=e.sibling;e.tag!==5&&e.tag!==6&&e.tag!==18;){if(e.tag===27&&va(e.type)||e.flags&2||e.child===null||e.tag===4)continue e;e.child.return=e,e=e.child}if(!(e.flags&2))return e.stateNode}}function rc(e,t,l,a){var n=e.tag;if(n===5||n===6)n=e.stateNode,t?(l.nodeType===9?l.body:l.nodeName==="HTML"?l.ownerDocument.body:l).insertBefore(n,t):(t=l.nodeType===9?l.body:l.nodeName==="HTML"?l.ownerDocument.body:l,t.appendChild(n),l=l._reactRootContainer,l!=null||t.onclick!==null||(t.onclick=yl)),Ku(e,a),Le=!0;else if(n!==4&&(n===27&&(Ku(e,a),a=null,va(e.type)&&(l=e.stateNode,t=null)),e=e.child,e!==null))for(rc(e,t,l,a),e=e.sibling;e!==null;)rc(e,t,l,a),e=e.sibling}function Ju(e,t,l,a){var n=e.tag;if(n===5||n===6)n=e.stateNode,t?l.insertBefore(n,t):l.appendChild(n),Ku(e,a),Le=!0;else if(n!==4&&(n===27&&(Ku(e,a),a=null,va(e.type)&&(l=e.stateNode)),e=e.child,e!==null))for(Ju(e,t,l,a),e=e.sibling;e!==null;)Ju(e,t,l,a),e=e.sibling}function hm(e){var t=e.stateNode,l=e.memoizedProps;try{for(var a=e.type,n=t.attributes;n.length;)t.removeAttributeNode(n[0]);Nt(t,a,l),t[xt]=e,t[Mt]=l}catch(i){ke(e,e.return,i)}}var $u=!1,Xt=null;function pm(e){(e.tag===30||e.subtreeFlags&33554432)&&($u=!0)}var _l=null;function gm(){var e=_l;return _l=null,e}var Ut=0;function An(e,t,l,a,n){return Ut=0,xm(e.child,t,l,a,n)}function xm(e,t,l,a,n){for(var i=!1;e!==null;){if(e.tag===5){var r=e.stateNode;if(a!==null){var f=Vc(r);a.push(f),f.view&&(i=!0)}else i||Vc(r).view&&(i=!0);$u=!0,gh(r,Ut===0?t:t+"_"+Ut,l),Ut++}else(e.tag!==22||e.memoizedState===null)&&(e.tag===30&&n||xm(e.child,t,l,a,n)&&(i=!0));e=e.sibling}return i}function jl(e,t){for(;e!==null;)e.tag===5?xh(e.stateNode,e.memoizedProps):(e.tag!==22||e.memoizedState===null)&&(e.tag===30&&t||jl(e.child,t)),e=e.sibling}function Fu(e){if(e.subtreeFlags&18874368)for(e=e.child;e!==null;){if((e.tag!==22||e.memoizedState===null)&&(Fu(e),e.tag===30&&(e.flags&18874368)!==0&&e.stateNode.paired)){var t=e.memoizedProps;if(t.name==null||t.name==="auto")throw Error(c(544));var l=t.name;t=Bl(t.default,t.share),t!=="none"&&(An(e,l,t,null,!1)||jl(e.child,!1))}e=e.sibling}}function cc(e,t){if(e.tag===30){var l=e.stateNode,a=e.memoizedProps,n=Hl(a,l),i=Bl(a.default,l.paired?a.share:a.enter);i!=="none"?An(e,n,i,null,!1)?(Fu(e),l.paired||t||Hn(e,a.onEnter)):jl(e.child,!1):Fu(e)}else if(e.subtreeFlags&33554432)for(e=e.child;e!==null;)cc(e,t),e=e.sibling;else Fu(e)}function oc(e){if(Xt!==null&&Xt.size!==0){var t=Xt;if(e.subtreeFlags&18874368)for(e=e.child;e!==null;){if(e.tag!==22||e.memoizedState===null){if(e.tag===30&&e.flags&18874368){var l=e.memoizedProps,a=l.name;if(a!=null&&a!=="auto"){var n=t.get(a);if(n!==void 0){var i=Bl(l.default,l.share);if(i!=="none"&&(An(e,a,i,null,!1)?(i=e.stateNode,n.paired=i,i.paired=n,Hn(e,l.onShare)):jl(e.child,!1)),t.delete(a),t.size===0)break}}}oc(e)}e=e.sibling}}}function fc(e){if(e.tag===30){var t=e.memoizedProps,l=Hl(t,e.stateNode),a=Xt!==null?Xt.get(l):void 0,n=Bl(t.default,a!==void 0?t.share:t.exit);n!=="none"&&(An(e,l,n,null,!1)?a!==void 0?(n=e.stateNode,a.paired=n,n.paired=a,Xt.delete(l),Hn(e,t.onShare)):Hn(e,t.onExit):jl(e.child,!1)),Xt!==null&&oc(e)}else if(e.subtreeFlags&33554432)for(e=e.child;e!==null;)fc(e),e=e.sibling;else Xt!==null&&oc(e)}function vm(e){for(e=e.child;e!==null;){if(e.tag===30){var t=e.memoizedProps,l=Hl(t,e.stateNode);t=Bl(t.default,t.update),e.flags&=-5,t!=="none"&&An(e,l,t,e.memoizedState=[],!1)}else e.subtreeFlags&33554432&&vm(e);e=e.sibling}}function dc(e){if(e.subtreeFlags&18874368)for(e=e.child;e!==null;){if(e.tag!==22||e.memoizedState===null){if(e.tag===30&&e.flags&18874368){var t=e.stateNode;t.paired!==null&&(t.paired=null,jl(e.child,!1))}dc(e)}e=e.sibling}}function Iu(e){if(e.tag===30)e.stateNode.paired=null,jl(e.child,!1),dc(e);else if(e.subtreeFlags&33554432)for(e=e.child;e!==null;)Iu(e),e=e.sibling;else dc(e)}function ym(e){for(e=e.child;e!==null;)e.tag===30?jl(e.child,!1):e.subtreeFlags&33554432&&ym(e),e=e.sibling}function mc(e,t,l,a,n,i,r){for(var f=!1;t!==null;){if(t.tag===5){var x=t.stateNode;if(i!==null&&Ut<i.length){var E=i[Ut],w=Vc(x);(E.view||w.view)&&(f=!0);var H;if(H=(e.flags&4)===0)if(w.clip)H=!0;else{H=E.rect;var _=w.rect;H=H.y!==_.y||H.x!==_.x||H.height!==_.height||H.width!==_.width}H&&(e.flags|=4),w.abs?w=!E.abs:(E=E.rect,w=w.rect,w=E.height!==w.height||E.width!==w.width),w&&(e.flags|=32)}else e.flags|=32;e.flags&4&&gh(x,Ut===0?l:l+"_"+Ut,n),f&&e.flags&4||(_l===null&&(_l=[]),_l.push(x,Ut===0?a:a+"_"+Ut,t.memoizedProps)),Ut++}else(t.tag!==22||t.memoizedState===null)&&(t.tag===30&&r?e.flags|=t.flags&32:mc(e,t.child,l,a,n,i,r)&&(f=!0));t=t.sibling}return f}function bm(e,t){for(e=e.child;e!==null;){if(e.tag===30){var l=e.memoizedProps,a=e.stateNode,n=Hl(l,a),i=Bl(l.default,l.update),r;r=e.memoizedState,e.memoizedState=null,a=e;var f=e.child;Ut=0,n=mc(a,f,n,n,i,r,!1),e.flags&4&&n&&Hn(e,l.onUpdate)}else e.subtreeFlags&33554432&&bm(e);e=e.sibling}}var ht=!1,Ye=!1,El=!1,hc=!1,Sm=typeof WeakSet=="function"?WeakSet:Set,pt=null,Tl=!1,Mi=!1,Wu=!1,pc=!1;function dx(e,t,l){if(e=e.containerInfo,Yc=Kn,e=Ef(e),tr(e)){if("selectionStart"in e)var a={start:e.selectionStart,end:e.selectionEnd};else e:{a=(a=e.ownerDocument)&&a.defaultView||window;var n=a.getSelection&&a.getSelection();if(n&&n.rangeCount!==0){a=n.anchorNode;var i=n.anchorOffset,r=n.focusNode;n=n.focusOffset;try{a.nodeType,r.nodeType}catch{a=null;break e}var f=0,x=-1,E=-1,w=0,H=0,_=e,O=null;t:for(;;){for(var $;_!==a||i!==0&&_.nodeType!==3||(x=f+i),_!==r||n!==0&&_.nodeType!==3||(E=f+n),_.nodeType===3&&(f+=_.nodeValue.length),($=_.firstChild)!==null;)O=_,_=$;for(;;){if(_===e)break t;if(O===a&&++w===i&&(x=f),O===r&&++H===n&&(E=f),($=_.nextSibling)!==null)break;_=O,O=_.parentNode}_=$}a=x===-1||E===-1?null:{start:x,end:E}}else a=null}a=a||{start:0,end:0}}else a=null;for(Gc={focusedElem:e,selectionRange:a},Kn=!1,l=(l&335544064)===l,pt=t,t=l?9270:1024;pt!==null;){if(e=pt,l&&(a=e.deletions,a!==null))for(i=0;i<a.length;i++)l&&fc(a[i]);if(e.alternate===null&&e.flags&2)l&&pm(e),Pu(l);else{if(e.tag===22){if(a=e.alternate,e.memoizedState!==null){a!==null&&a.memoizedState===null&&l&&fc(a),Pu(l);continue}else if(a!==null&&a.memoizedState!==null){l&&pm(e),Pu(l);continue}}a=e.child,e.subtreeFlags&t&&a!==null?(a.return=e,pt=a):(l&&vm(e),Pu(l))}}Xt=null}function Pu(e){for(;pt!==null;){var t=pt,l=e,a=t.alternate,n=t.flags;switch(t.tag){case 0:case 11:case 15:break;case 1:if(n&1024&&a!==null){l=void 0,n=a.memoizedProps,a=a.memoizedState;var i=t.stateNode;try{var r=Ka(t.type,n);l=i.getSnapshotBeforeUpdate(r,a),i.__reactInternalSnapshotBeforeUpdate=l}catch(f){ke(t,t.return,f)}}break;case 3:if(n&1024){if(a=t.stateNode.containerInfo,l=a.nodeType,l===9)Jc(a);else if(l===1)switch(a.nodeName){case"HEAD":case"HTML":case"BODY":Jc(a);break;default:a.textContent=""}}break;case 5:case 26:case 27:case 6:case 4:case 17:break;case 30:l&&a!==null&&(l=Hl(a.memoizedProps,a.stateNode),n=t.memoizedProps,n=Bl(n.default,n.update),n!=="none"&&An(a,l,n,a.memoizedState=[],!0));break;default:if(n&1024)throw Error(c(163))}if(a=t.sibling,a!==null){a.return=t.return,pt=a;break}pt=t.return}}function Nm(e,t,l){var a=l.flags;switch(l.tag){case 0:case 11:case 15:Cl(e,l),a&4&&Oi(5,l);break;case 1:if(Cl(e,l),a&4)if(e=l.stateNode,t===null)try{e.componentDidMount()}catch(r){ke(l,l.return,r)}else{var n=Ka(l.type,t.memoizedProps);t=t.memoizedState;try{e.componentDidUpdate(n,t,e.__reactInternalSnapshotBeforeUpdate)}catch(r){ke(l,l.return,r)}}a&64&&om(l),a&512&&Nl(l,l.return);break;case 3:if(Cl(e,l),a&64&&(e=l.updateQueue,e!==null)){if(t=null,l.child!==null)switch(l.child.tag){case 27:case 5:t=l.child.stateNode;break;case 1:t=l.child.stateNode}try{Pf(e,t)}catch(r){ke(l,l.return,r)}}break;case 27:t===null&&a&4&&hm(l);case 26:case 5:Cl(e,l),t===null&&a&4&&ic(l),a&512&&Nl(l,l.return);break;case 12:Cl(e,l);break;case 31:Cl(e,l),a&4&&Tm(e,l);break;case 13:Cl(e,l),a&4&&Cm(e,l),a&64&&(e=l.memoizedState,e!==null&&(e=e.dehydrated,e!==null&&(l=jx.bind(null,l),iv(e,l))));break;case 22:if(a=l.memoizedState!==null||ht,!a){var i=t!==null&&t.memoizedState!==null||Ye;t=ht,n=Ye,ht=a,(Ye=i)&&!n?(a=2,l.subtreeFlags&8772&&(a|=1),hl(e,l,a)):Cl(e,l),ht=t,Ye=n}break;case 30:Cl(e,l),a&512&&Nl(l,l.return);break;case 7:a&512&&Nl(l,l.return);default:Cl(e,l)}}function gc(e,t){for(e=e.child;e!==null;)_m(e,t),e=e.sibling}function _m(e,t){switch(e.tag){case 5:case 26:try{var l=e.stateNode;if(t){var a=l.style;typeof a.setProperty=="function"?a.setProperty("display","none","important"):a.display="none"}else{var n=e.stateNode,i=e.memoizedProps.style,r=i!=null&&i.hasOwnProperty("display")?i.display:null;n.style.display=r==null||typeof r=="boolean"?"":(""+r).trim()}}catch(x){ke(e,e.return,x)}xc(e,t);break;case 6:try{e.stateNode.nodeValue=t?"":e.memoizedProps,Le=!0}catch(x){ke(e,e.return,x)}break;case 18:try{var f=e.stateNode;t?ph(f,!0):ph(e.stateNode,!1)}catch(x){ke(e,e.return,x)}break;case 22:case 23:e.memoizedState===null&&gc(e,t);break;default:gc(e,t)}}function xc(e,t){if(e.subtreeFlags&67108864)for(e=e.child;e!==null;){e:{var l=e,a=t;switch(l.tag){case 4:_m(l,a);break e;case 22:l.memoizedState===null&&xc(l,a);break e;default:xc(l,a)}}e=e.sibling}}function jm(e){var t=e.alternate;t!==null&&(e.alternate=null,jm(t)),e.child=null,e.deletions=null,e.sibling=null,e.tag===5&&(t=e.stateNode,t!==null&&nu(t)),e.stateNode=null,e.return=null,e.dependencies=null,e.memoizedProps=null,e.memoizedState=null,e.pendingProps=null,e.stateNode=null,e.updateQueue=null}var We=null,Lt=!1;function dl(e,t,l){for(l=l.child;l!==null;)Em(e,t,l),l=l.sibling}function Em(e,t,l){if(ft&&typeof ft.onCommitFiberUnmount=="function")try{ft.onCommitFiberUnmount(Et,l)}catch{}switch(l.tag){case 26:Ye||St(l,t),dl(e,t,l),l.memoizedState?l.memoizedState.count--:l.stateNode&&!Ye&&(l=l.stateNode,l.parentNode.removeChild(l));break;case 27:Ye||St(l,t),wi(l);var a=We,n=Lt;va(l.type)&&(We=l.stateNode,Lt=!1),dl(e,t,l),Ah(l.stateNode,l.type,l.memoizedProps),We=a,Lt=n;break;case 5:Ye||St(l,t),wi(l);case 6:if(l.tag===6&&wi(l),a=We,n=Lt,We=null,dl(e,t,l),We=a,Lt=n,We!==null)if(Lt)try{(We.nodeType===9?We.body:We.nodeName==="HTML"?We.ownerDocument.body:We).removeChild(l.stateNode),Le=!0}catch(i){ke(l,t,i)}else try{We.removeChild(l.stateNode),Le=!0}catch(i){ke(l,t,i)}break;case 18:We!==null&&(Lt?(e=We,hh(e.nodeType===9?e.body:e.nodeName==="HTML"?e.ownerDocument.body:e,l.stateNode),Jn(e)):hh(We,l.stateNode));break;case 4:a=We,n=Lt,We=l.stateNode.containerInfo,Lt=!0,dl(e,t,l),We=a,Lt=n;break;case 0:case 11:case 14:case 15:fa(2,l,t),Ye||fa(4,l,t),dl(e,t,l);break;case 1:Ye||(St(l,t),a=l.stateNode,typeof a.componentWillUnmount=="function"&&fm(l,t,a)),dl(e,t,l);break;case 21:dl(e,t,l);break;case 22:Ye=(a=Ye)||l.memoizedState!==null,dl(e,t,l),Ye=a;break;case 30:St(l,t),dl(e,t,l);break;case 7:Ye||St(l,t),dl(e,t,l);break;default:dl(e,t,l)}}function Tm(e,t){if(t.memoizedState===null&&(e=t.alternate,e!==null&&(e=e.memoizedState,e!==null))){e=e.dehydrated;try{Jn(e)}catch(l){ke(t,t.return,l)}}}function Cm(e,t){if(t.memoizedState===null&&(e=t.alternate,e!==null&&(e=e.memoizedState,e!==null&&(e=e.dehydrated,e!==null))))try{Jn(e)}catch(l){ke(t,t.return,l)}}function mx(e){switch(e.tag){case 31:case 13:case 19:var t=e.stateNode;return t===null&&(t=e.stateNode=new Sm),t;case 22:return e=e.stateNode,t=e._retryCache,t===null&&(t=e._retryCache=new Sm),t;default:throw Error(c(435,e.tag))}}function es(e,t){var l=mx(e);t.forEach(function(a){if(!l.has(a)){l.add(a);var n=Ex.bind(null,e,a);a.then(n,n)}})}function Rt(e,t,l){var a=t.deletions;if(a!==null)for(var n=0;n<a.length;n++){var i=a[n],r=e,f=t,x=f;e:for(;x!==null;){switch(x.tag){case 27:if(va(x.type)){We=x.stateNode,Lt=!1;break e}break;case 5:We=x.stateNode,Lt=!1;break e;case 3:case 4:We=x.stateNode.containerInfo,Lt=!0;break e}x=x.return}if(We===null)throw Error(c(160));Em(r,f,i),We=null,Lt=!1,r=i.alternate,r!==null&&(r.return=null),i.return=null}if(t.subtreeFlags&13886)for(t=t.child;t!==null;)zm(t,e,l),t=t.sibling}var ml=null;function zm(e,t,l){var a=e.alternate,n=e.flags;switch(e.tag){case 0:case 11:case 14:case 15:if(n&4&&(a=e.updateQueue,a=a!==null?a.events:null,a!==null))for(var i=0;i<a.length;i++){var r=a[i];r.ref.impl=r.nextImpl}Rt(t,e,l),Ot(e),n&4&&(fa(3,e,e.return),Oi(3,e),fa(5,e,e.return));break;case 1:Rt(t,e,l),Ot(e),n&512&&(Ye||a===null||St(a,a.return)),n&64&&ht&&(e=e.updateQueue,e!==null&&(t=e.callbacks,t!==null&&(l=e.shared.hiddenCallbacks,e.shared.hiddenCallbacks=l===null?t:l.concat(t))));break;case 26:if(i=ml,Rt(t,e,l),Ot(e),n&512&&(Ye||a===null||St(a,a.return)),n&4)if(n=a!==null?a.memoizedState:null,l=e.memoizedState,a===null)if(l===null)if(e.stateNode===null)if(ht)e.stateNode=fh(e.type,e.memoizedProps,t.containerInfo,e);else{e:{t=e.type,l=e.memoizedProps,n=i.ownerDocument||i;t:switch(t){case"title":a=n.getElementsByTagName("title")[0],(!a||a[ii]||a[xt]||a.namespaceURI==="http://www.w3.org/2000/svg"||a.hasAttribute("itemprop"))&&(a=n.createElement(t),n.head.insertBefore(a,n.querySelector("head > title"))),Nt(a,t,l),a[xt]=e,dt(a),t=a;break e;case"link":if(i=Uh("link","href",n).get(t+(l.href||""))){for(r=0;r<i.length;r++)if(a=i[r],a.getAttribute("href")===(l.href==null||l.href===""?null:l.href)&&a.getAttribute("rel")===(l.rel==null?null:l.rel)&&a.getAttribute("title")===(l.title==null?null:l.title)&&a.getAttribute("crossorigin")===(l.crossOrigin==null?null:l.crossOrigin)){i.splice(r,1);break t}}a=n.createElement(t),Nt(a,t,l),n.head.appendChild(a);break;case"meta":if(i=Uh("meta","content",n).get(t+(l.content||""))){for(r=0;r<i.length;r++)if(a=i[r],a.getAttribute("content")===(l.content==null?null:""+l.content)&&a.getAttribute("name")===(l.name==null?null:l.name)&&a.getAttribute("property")===(l.property==null?null:l.property)&&a.getAttribute("http-equiv")===(l.httpEquiv==null?null:l.httpEquiv)&&a.getAttribute("charset")===(l.charSet==null?null:l.charSet)){i.splice(r,1);break t}}a=n.createElement(t),Nt(a,t,l),n.head.appendChild(a);break;default:throw Error(c(468,t))}a[xt]=e,dt(a),t=a}e.stateNode=t}else ht||to(i,e.type,e.stateNode);else e.stateNode=Dh(i,l,e.memoizedProps);else n!==l?(n===null?(t=a.stateNode,t===null||Ye||t.parentNode.removeChild(t)):n.count--,l===null?ht||to(i,e.type,e.stateNode):Dh(i,l,e.memoizedProps)):l===null&&e.stateNode!==null&&uc(e,e.memoizedProps,a.memoizedProps);break;case 27:Rt(t,e,l),Ot(e),n&512&&(Ye||a===null||St(a,a.return)),a!==null&&n&4&&uc(e,e.memoizedProps,a.memoizedProps);break;case 5:if(i=El,El=!1,Rt(t,e,l),El=i,Ot(e),n&512&&(Ye||a===null||St(a,a.return)),e.flags&32){t=e.stateNode;try{fn(t,""),Le=!0}catch(w){ke(e,e.return,w)}}n&4&&e.stateNode!=null&&(t=e.memoizedProps,uc(e,t,a!==null?a.memoizedProps:t)),n&1024&&(hc=!0);break;case 6:if(Rt(t,e,l),Ot(e),n&4){if(e.stateNode===null)throw Error(c(162));t=e.memoizedProps,l=e.stateNode;try{l.nodeValue=t,Le=!0}catch(w){ke(e,e.return,w)}}break;case 3:if(Le=!1,ps=null,i=ml,ml=ki(t.containerInfo),Rt(t,e,l),ml=i,Ot(e),n&4&&a!==null&&a.memoizedState.isDehydrated)try{Jn(t.containerInfo)}catch(w){ke(e,e.return,w)}hc&&(hc=!1,Am(e)),Le=!1;break;case 4:n=El,El=ht,a=Jo(),i=ml,ml=ki(e.stateNode.containerInfo),Rt(t,e,l),Ot(e),ml=i,Le&&Mi&&(Wu=!0),Le=a,El=n;break;case 12:Rt(t,e,l),Ot(e);break;case 31:Rt(t,e,l),Ot(e),n&4&&(t=e.updateQueue,t!==null&&(e.updateQueue=null,es(e,t)));break;case 13:Rt(t,e,l),Ot(e),e.child.flags&8192&&e.memoizedState!==null!=(a!==null&&a.memoizedState!==null)&&(as=M()),n&4&&(t=e.updateQueue,t!==null&&(e.updateQueue=null,es(e,t)));break;case 22:i=e.memoizedState!==null,r=a!==null&&a.memoizedState!==null;var f=ht,x=Ye,E=El;ht=f||i,El=E||i,Ye=x||r,Rt(t,e,l),Ye=x,El=E,ht=f,Ot(e),n&8192&&(t=e.stateNode,t._visibility=i?t._visibility&-2:t._visibility|1,!i||a===null||r||ht||Ye||(t=r||Ye,l=ht,a=Ye,ht=i||ht,Ye=t,da(e,2),ht=l,Ye=a),!i&&El||gc(e,i)),n&4&&(t=e.updateQueue,t!==null&&(l=t.retryQueue,l!==null&&(t.retryQueue=null,es(e,l))));break;case 19:Rt(t,e,l),Ot(e),n&4&&(t=e.updateQueue,t!==null&&(e.updateQueue=null,es(e,t)));break;case 30:n&512&&(Ye||a===null||St(a,a.return)),n=Jo(),i=Mi,r=(l&335544064)===l,f=e.memoizedProps,Mi=r&&Bl(f.default,f.update)!=="none",Rt(t,e,l),Ot(e),r&&a!==null&&Le&&(e.flags|=4),Mi=i,Le=n;break;case 21:break;case 7:n&512&&(Ye||a===null||St(a,a.return)),a&&a.stateNode!==null&&(a.stateNode._fragmentFiber=e);default:Rt(t,e,l),Ot(e)}}function Ot(e){var t=e.flags;if(t&2){try{for(var l,a=e.return;a!==null;){if(mm(a)){l=a;break}a=a.return}a=null;for(var n=e.return;n!==null;){if(nc(n)){var i=n.stateNode;a===null?a=[i]:a.push(i)}if(ac(n))break;n=n.return}var r=a;if(l==null)throw Error(c(160));switch(l.tag){case 27:var f=l.stateNode,x=sc(e);Ju(e,x,f,r);break;case 5:var E=l.stateNode;l.flags&32&&(fn(E,""),l.flags&=-33);var w=sc(e);Ju(e,w,E,r);break;case 3:case 4:var H=l.stateNode.containerInfo,_=sc(e);rc(e,_,H,r);break;default:throw Error(c(161))}}catch(O){ke(e,e.return,O)}e.flags&=-3}t&4096&&(e.flags&=-4097)}function Am(e){if(e.subtreeFlags&1024)for(e=e.child;e!==null;){var t=e;Am(t),t.tag===5&&t.flags&1024&&(t=t.stateNode,Kn=!0,t.reset(),Kn=!1),e=e.sibling}}function Rn(e,t){if(t.subtreeFlags&9270)for(t=t.child;t!==null;)Rm(t,e),t=t.sibling;else bm(t)}function Rm(e,t){var l=e.alternate;if(l===null)cc(e,!1);else switch(e.tag){case 3:if(pc=Tl=!1,gm(),Rn(t,e),!Tl&&!Wu){if(e=_l,e!==null)for(var a=0;a<e.length;a+=3){l=e[a];var n=e[a+1];xh(l,e[a+2]),l=l.ownerDocument.documentElement,l!==null&&l.animate({opacity:[0,0],pointerEvents:["none","none"]},{duration:0,fill:"forwards",pseudoElement:"::view-transition-group("+n+")"})}e=t.containerInfo,e=e.nodeType===9?e.documentElement:e.ownerDocument.documentElement,e!==null&&e.style.viewTransitionName===""&&(e.style.viewTransitionName="none",e.animate({opacity:[0,0],pointerEvents:["none","none"]},{duration:0,fill:"forwards",pseudoElement:"::view-transition-group(root)"}),e.animate({width:[0,0],height:[0,0]},{duration:0,fill:"forwards",pseudoElement:"::view-transition"})),pc=!0}_l=null;break;case 5:Rn(t,e);break;case 4:a=Tl,Tl=!1,Rn(t,e),Tl&&(Wu=!0),Tl=a;break;case 22:e.memoizedState===null&&(l.memoizedState!==null?cc(e,!1):Rn(t,e));break;case 30:a=Tl,n=gm(),Tl=!1,Rn(t,e),Tl&&(e.flags|=4);var i=e.memoizedProps,r=e.stateNode;t=Hl(i,r),r=Hl(l.memoizedProps,r);var f=Bl(i.default,i.update);f==="none"?t=!1:(i=l.memoizedState,l.memoizedState=null,l=e.child,Ut=0,t=mc(e,l,t,r,f,i,!0),Ut!==(i===null?0:i.length)&&(e.flags|=32)),e.flags&4&&t?(Hn(e,e.memoizedProps.onUpdate),_l=n):n!==null&&(n.push.apply(n,_l),_l=n),Tl=e.flags&32?!0:a;break;default:Rn(t,e)}}function Cl(e,t){if(t.subtreeFlags&8772)for(t=t.child;t!==null;)Nm(e,t.alternate,t),t=t.sibling}function da(e,t){for(e=e.child;e!==null;){var l=e,a=t;switch(l.tag){case 0:case 11:case 14:case 15:fa(4,l,l.return),da(l,a);break;case 1:St(l,l.return);var n=l.stateNode;typeof n.componentWillUnmount=="function"&&fm(l,l.return,n),da(l,a);break;case 27:a&2&&Ah(l.stateNode,l.type,l.memoizedProps);case 5:St(l,l.return),l.tag!==5&&l.tag!==27||wi(l),da(l,a);break;case 6:wi(l);break;case 26:St(l,l.return),n=l.stateNode,l.memoizedState!==null||n===null||Ye||n.parentNode.removeChild(n),da(l,a);break;case 22:l.memoizedState===null&&da(l,a);break;case 30:St(l,l.return),da(l,a);break;case 7:St(l,l.return);default:da(l,a)}e=e.sibling}}function hl(e,t,l){for(l=t.subtreeFlags&8772?l:l&-2,t=t.child;t!==null;){var a=t.alternate,n=e,i=t,r=i.flags,f=(l&1)!==0;switch(i.tag){case 0:case 11:case 15:hl(n,i,l),Oi(4,i);break;case 1:if(hl(n,i,l),a=i,n=a.stateNode,typeof n.componentDidMount=="function")try{n.componentDidMount()}catch(w){ke(a,a.return,w)}if(a=i,n=a.updateQueue,n!==null){var x=a.stateNode;try{var E=n.shared.hiddenCallbacks;if(E!==null)for(n.shared.hiddenCallbacks=null,n=0;n<E.length;n++)Wf(E[n],x)}catch(w){ke(a,a.return,w)}}f&&r&64&&om(i),Nl(i,i.return);break;case 27:l&2&&hm(i);case 5:i.tag!==5&&i.tag!==27||dm(i),hl(n,i,l),f&&a===null&&r&4&&ic(i),Nl(i,i.return);break;case 6:dm(i);break;case 26:x=i.stateNode,i.memoizedState!==null||x===null||ht||to(ki(x.ownerDocument),i.type,x),hl(n,i,l),f&&a===null&&r&4&&ic(i),Nl(i,i.return);break;case 12:hl(n,i,l);break;case 31:hl(n,i,l),f&&r&4&&Tm(n,i);break;case 13:hl(n,i,l),f&&r&4&&Cm(n,i);break;case 22:i.memoizedState===null&&hl(n,i,l),Nl(i,i.return);break;case 30:hl(n,i,l),Nl(i,i.return);break;case 7:Nl(i,i.return);default:hl(n,i,l)}t=t.sibling}}function vc(e,t){var l=null;e!==null&&e.memoizedState!==null&&e.memoizedState.cachePool!==null&&(l=e.memoizedState.cachePool.pool),e=null,t.memoizedState!==null&&t.memoizedState.cachePool!==null&&(e=t.memoizedState.cachePool.pool),e!==l&&(e!=null&&e.refCount++,l!=null&&vi(l))}function yc(e,t){e=null,t.alternate!==null&&(e=t.alternate.memoizedState.cache),t=t.memoizedState.cache,t!==e&&(t.refCount++,e!=null&&vi(e))}function il(e,t,l,a){var n=(l&335544064)===l;if(t.subtreeFlags&(n?10262:10256))for(t=t.child;t!==null;)Om(e,t,l,a),t=t.sibling;else n&&ym(t)}function Om(e,t,l,a){var n=(l&335544064)===l;n&&t.alternate===null&&t.return!==null&&t.return.alternate!==null&&Iu(t);var i=t.flags;switch(t.tag){case 0:case 11:case 15:il(e,t,l,a),i&2048&&Oi(9,t);break;case 1:il(e,t,l,a);break;case 3:il(e,t,l,a),n&&pc&&(e=e.containerInfo,e=e.nodeType===9?e.body:e.nodeName==="HTML"?e.ownerDocument.body:e,e.style.viewTransitionName==="root"&&(e.style.viewTransitionName=""),e=e.ownerDocument.documentElement,e!==null&&e.style.viewTransitionName==="none"&&(e.style.viewTransitionName="")),i&2048&&(i=null,t.alternate!==null&&(i=t.alternate.memoizedState.cache),t=t.memoizedState.cache,t!==i&&(t.refCount++,i!=null&&vi(i)));break;case 12:if(i&2048){il(e,t,l,a),i=t.stateNode;try{var r=t.memoizedProps,f=r.id,x=r.onPostCommit;typeof x=="function"&&x(f,t.alternate===null?"mount":"update",i.passiveEffectDuration,-0)}catch(E){ke(t,t.return,E)}}else il(e,t,l,a);break;case 31:il(e,t,l,a);break;case 13:il(e,t,l,a);break;case 23:break;case 22:r=t.stateNode,f=t.alternate,t.memoizedState!==null?(n&&f!==null&&f.memoizedState===null&&Iu(f),r._visibility&2?il(e,t,l,a):Di(e,t)):(n&&f!==null&&f.memoizedState!==null&&Iu(t),r._visibility&2?il(e,t,l,a):(r._visibility|=2,On(e,t,l,a,(t.subtreeFlags&10256)!==0||!1))),i&2048&&vc(f,t);break;case 24:il(e,t,l,a),i&2048&&yc(t.alternate,t);break;case 30:n&&(i=t.alternate,i!==null&&(jl(i.child,!0),jl(t.child,!0))),il(e,t,l,a);break;default:il(e,t,l,a)}}function On(e,t,l,a,n){for(n=n&&((t.subtreeFlags&10256)!==0||!1),t=t.child;t!==null;){var i=e,r=t,f=l,x=a,E=r.flags;switch(r.tag){case 0:case 11:case 15:On(i,r,f,x,n),Oi(8,r);break;case 23:break;case 22:var w=r.stateNode;r.memoizedState!==null?w._visibility&2?On(i,r,f,x,n):Di(i,r):(w._visibility|=2,On(i,r,f,x,n)),n&&E&2048&&vc(r.alternate,r);break;case 24:On(i,r,f,x,n),n&&E&2048&&yc(r.alternate,r);break;default:On(i,r,f,x,n)}t=t.sibling}}function Di(e,t){if(t.subtreeFlags&10256)for(t=t.child;t!==null;){var l=e,a=t,n=a.flags;switch(a.tag){case 22:Di(l,a),n&2048&&vc(a.alternate,a);break;case 24:Di(l,a),n&2048&&yc(a.alternate,a);break;default:Di(l,a)}t=t.sibling}}var Ja=8192;function $a(e,t,l){if(e.subtreeFlags&Ja)for(e=e.child;e!==null;)wm(e,t,l),e=e.sibling}function wm(e,t,l){switch(e.tag){case 26:$a(e,t,l),e.flags&Ja&&(e.memoizedState!==null?yv(l,ml,e.memoizedState,e.memoizedProps):(e=e.stateNode,(t&335544128)===t&&qh(l,e)));break;case 5:$a(e,t,l),e.flags&Ja&&(e=e.stateNode,(t&335544128)===t&&qh(l,e));break;case 3:case 4:var a=ml;ml=ki(e.stateNode.containerInfo),$a(e,t,l),ml=a;break;case 22:e.memoizedState===null&&(a=e.alternate,a!==null&&a.memoizedState!==null?(a=Ja,Ja=16777216,$a(e,t,l),Ja=a):$a(e,t,l));break;case 30:if(e.flags&Ja&&(a=e.memoizedProps.name,a!=null&&a!=="auto")){var n=e.stateNode;n.paired=null,Xt===null&&(Xt=new Map),Xt.set(a,n)}$a(e,t,l);break;default:$a(e,t,l)}}function Mm(e){var t=e.alternate;if(t!==null&&(e=t.child,e!==null)){t.child=null;do t=e.sibling,e.sibling=null,e=t;while(e!==null)}}function Ui(e){var t=e.deletions;if(e.flags&16){if(t!==null)for(var l=0;l<t.length;l++){var a=t[l];pt=a,Um(a,e)}Mm(e)}if(e.subtreeFlags&10256)for(e=e.child;e!==null;)Dm(e),e=e.sibling}function Dm(e){switch(e.tag){case 0:case 11:case 15:Ui(e),e.flags&2048&&fa(9,e,e.return);break;case 3:Ui(e);break;case 12:Ui(e);break;case 22:var t=e.stateNode;e.memoizedState!==null&&t._visibility&2&&(e.return===null||e.return.tag!==13)?(t._visibility&=-3,ts(e)):Ui(e);break;default:Ui(e)}}function ts(e){var t=e.deletions;if(e.flags&16){if(t!==null)for(var l=0;l<t.length;l++){var a=t[l];pt=a,Um(a,e)}Mm(e)}for(e=e.child;e!==null;){switch(t=e,t.tag){case 0:case 11:case 15:fa(8,t,t.return),ts(t);break;case 22:l=t.stateNode,l._visibility&2&&(l._visibility&=-3,ts(t));break;default:ts(t)}e=e.sibling}}function Um(e,t){for(;pt!==null;){var l=pt;switch(l.tag){case 0:case 11:case 15:fa(8,l,t);break;case 23:case 22:if(l.memoizedState!==null&&l.memoizedState.cachePool!==null){var a=l.memoizedState.cachePool.pool;a!=null&&a.refCount++}break;case 24:vi(l.memoizedState.cache)}if(a=l.child,a!==null)a.return=l,pt=a;else e:for(l=e;pt!==null;){a=pt;var n=a.sibling,i=a.return;if(jm(a),a===l){pt=null;break e}if(n!==null){n.return=i,pt=n;break e}pt=i}}}var hx={getCacheForType:function(e){var t=vt(ut),l=t.data.get(e);return l===void 0&&(l=e(),t.data.set(e,l)),l},cacheSignal:function(){return vt(ut).controller.signal}},px=typeof WeakMap=="function"?WeakMap:Map,qe=0,Ve=null,Te=null,Re=0,Ge=0,Vt=null,ma=!1,wn=!1,bc=!1,Kl=0,lt=0,ha=0,Fa=0,ls=0,Zt=0,Mn=0,Li=null,Ht=null,Sc=!1,as=0,Lm=0,ns=1/0,is=null,pa=null,et=0,pl=null,Ia=null,zl=0,Nc=0,_c=null,Hm=null,Dn=null,Un=null,Ln=null,Hi=0,us=null;function Kt(){return qe&2&&Re!==0?Re&-Re:ae.T!==null?Mc():qo()}function Bm(){if(Zt===0)if(!(Re&536870912)||_e){var e=za;za<<=1,!(za&3932160)&&(za=262144),Zt=e}else Zt=536870912;return e=yt.current,e!==null&&(e.flags|=32),Zt}function Hn(e,t){if(t!=null){var l=e.stateNode,a=l.ref;a===null&&(a=l.ref=vh(Hl(e.memoizedProps,l))),Un===null&&(Un=[]),Un.push(t.bind(null,a))}}function Bt(e,t,l){(e===Ve&&(Ge===2||Ge===9)||e.cancelPendingCommit!==null)&&(Bn(e,0),ga(e,Re,Zt,!1)),ni(e,l),(!(qe&2)||e!==Ve)&&(e===Ve&&(!(qe&2)&&(Fa|=l),lt===4&&ga(e,Re,Zt,!1)),Al(e))}function qm(e,t,l){if(qe&6)throw Error(c(327));var a=!l&&(t&127)===0&&(t&e.expiredLanes)===0||ai(e,t),n=a?vx(e,t):Ec(e,t,!0),i=a;do{if(n===0){wn&&!a&&ga(e,t,0,!1);break}else{if(l=e.current.alternate,i&&!gx(l)){n=Ec(e,t,!1),i=!1;continue}if(n===2){if(i=t,e.errorRecoveryDisabledLanes&i)var r=0;else r=e.pendingLanes&-536870913,r=r!==0?r:r&536870912?536870912:0;if(r!==0){t=r;e:{var f=e;n=Li;var x=f.current.memoizedState.isDehydrated;if(x&&(Bn(f,r).flags|=256),r=Ec(f,r,!1),r!==2&&r!==6){if(bc&&!x){f.errorRecoveryDisabledLanes|=i,Fa|=i,n=4;break e}i=Ht,Ht=n,i!==null&&(Ht===null?Ht=i:Ht.push.apply(Ht,i))}n=r}if(i=!1,n!==2)continue}}if(n===1){Bn(e,0),ga(e,t,0,!0);break}e:{switch(a=e,i=n,i){case 0:case 1:throw Error(c(345));case 4:if((t&4194048)!==t&&(t&62914560)!==t)break;case 6:ga(a,t,Zt,!ma);break e;case 2:Ht=null;break;case 3:case 5:break;default:throw Error(c(329))}if((t&62914560)===t&&(n=as+300-M(),10<n)){if(ga(a,t,Zt,!ma),lu(a,0,!0)!==0)break e;zl=t,a.timeoutHandle=Xc(Ym.bind(null,a,l,Ht,is,Sc,t,Zt,Fa,Mn,ma,i,"Throttled",-0,0),n);break e}Ym(a,l,Ht,is,Sc,t,Zt,Fa,Mn,ma,i,null,-0,0)}}break}while(!0);Al(e)}function Ym(e,t,l,a,n,i,r,f,x,E,w,H,_,O){e.timeoutHandle=-1;var $=t.subtreeFlags,te=(i&335544064)===i;if(H=null,(te||$&8192||($&16785408)===16785408)&&(H={stylesheets:null,count:0,imgCount:0,imgBytes:0,suspenseyImages:[],waitingForImages:!0,waitingForViewTransition:!1,unsuspend:yl},Xt=null,wm(t,i,H),te&&($=H,te=e.containerInfo,te=(te.nodeType===9?te:te.ownerDocument).__reactViewTransition,te!=null&&($.count++,$.waitingForViewTransition=!0,$=Vi.bind($),te.finished.then($,$))),$=(i&62914560)===i?as-M():(i&4194048)===i?Lm-M():0,$=bv(H,$),$!==null)){zl=i,e.cancelPendingCommit=$(Jm.bind(null,e,t,i,l,a,n,r,f,x,E,w,H,null,_,O)),ga(e,i,r,!E);return}Jm(e,t,i,l,a,n,r,f,x,E,w,H)}function gx(e){for(var t=e;;){var l=t.tag;if((l===0||l===11||l===15)&&t.flags&16384&&(l=t.updateQueue,l!==null&&(l=l.stores,l!==null)))for(var a=0;a<l.length;a++){var n=l[a],i=n.getSnapshot;n=n.value;try{if(!kt(i(),n))return!1}catch{return!1}}if(l=t.child,t.subtreeFlags&16384&&l!==null)l.return=t,t=l;else{if(t===e)break;for(;t.sibling===null;){if(t.return===null||t.return===e)return!0;t=t.return}t.sibling.return=t.return,t=t.sibling}}return!0}function ga(e,t,l,a){t=Do(e,t),t&=~ls,t&=~Fa,e.suspendedLanes|=t,e.pingedLanes&=~t,a&&(e.warmLanes|=t),a=e.expirationTimes;for(var n=t;0<n;){var i=31-it(n),r=1<<i;a[i]=-1,n&=~r}l!==0&&Lo(e,l,t)}function ss(){return qe&6?!0:(Bi(0),!1)}function jc(){if(Te!==null){if(Ge===0)var e=Te.return;else e=Te,Gl=Ba=null,wr(e),jn=null,Si=0,e=Te;for(;e!==null;)cm(e.alternate,e),e=e.return;Te=null}}function Bn(e,t){var l=e.timeoutHandle;return l!==-1&&(e.timeoutHandle=-1,Yx(l)),l=e.cancelPendingCommit,l!==null&&(e.cancelPendingCommit=null,l()),zl=0,jc(),Ve=e,Te=l=ql(e.current,null),Re=t,Ge=0,Vt=null,ma=!1,wn=ai(e,t),bc=!1,Mn=Zt=ls=Fa=ha=lt=0,Ht=Li=null,Sc=!1,Kl=Do(e,t),pu(),l}function Gm(e,t){be=null,ae.H=Yu,t===_n||t===Tu?(t=Jf(),Ge=3):t===yr?(t=Jf(),Ge=4):Ge=t===Kr?8:t!==null&&typeof t=="object"&&typeof t.then=="function"?6:1,Vt=t,Te===null&&(lt=1,Gu(e,tl(t,e.current)))}function km(){var e=yt.current;return e===null?!0:(Re&4194048)===Re?Tt===null:(Re&62914560)===Re||Re&536870912?e===Tt:!1}function Qm(){var e=ae.H;return ae.H=Yu,e===null?Yu:e}function Xm(){var e=ae.A;return ae.A=hx,e}function rs(){lt=4,ma||(Re&4194048)!==Re&&yt.current!==null||(wn=!0),!(ha&134217727)&&!(Fa&134217727)||Ve===null||ga(Ve,Re,Zt,!1)}function Ec(e,t,l){var a=qe;qe|=2;var n=Qm(),i=Xm();(Ve!==e||Re!==t)&&(is=null,Bn(e,t)),t=!1;var r=lt;e:do try{if(Ge!==0&&Te!==null){var f=Te,x=Vt;switch(Ge){case 8:jc(),r=6;break e;case 3:case 2:case 9:case 6:yt.current===null&&(t=!0);var E=Ge;if(Ge=0,Vt=null,qn(e,f,x,E),l&&wn){r=0;break e}break;default:E=Ge,Ge=0,Vt=null,qn(e,f,x,E)}}xx(),r=lt;break}catch(w){Gm(e,w)}while(!0);return t&&e.shellSuspendCounter++,Gl=Ba=null,qe=a,ae.H=n,ae.A=i,Te===null&&(Ve=null,Re=0,pu()),r}function xx(){for(;Te!==null;)Vm(Te)}function vx(e,t){var l=qe;qe|=2;var a=Qm(),n=Xm();Ve!==e||Re!==t?(is=null,ns=M()+500,Bn(e,t)):wn=ai(e,t);e:do try{if(Ge!==0&&Te!==null){t=Te;var i=Vt;t:switch(Ge){case 1:Ge=0,Vt=null,qn(e,t,i,1);break;case 2:case 9:if(Zf(i)){Ge=0,Vt=null,Zm(t);break}t=function(){Ge!==2&&Ge!==9||Ve!==e||(Ge=7),Al(e)},i.then(t,t);break e;case 3:Ge=7;break e;case 4:Ge=5;break e;case 7:Zf(i)?(Ge=0,Vt=null,Zm(t)):(Ge=0,Vt=null,qn(e,t,i,7));break;case 5:var r=null;switch(Te.tag){case 26:r=Te.memoizedState;case 5:case 27:var f=Te;if(r?Hh(r):f.stateNode.complete){Ge=0,Vt=null;var x=f.sibling;if(x!==null)Te=x;else{var E=f.return;E!==null?(Te=E,cs(E)):Te=null}break t}}Ge=0,Vt=null,qn(e,t,i,5);break;case 6:Ge=0,Vt=null,qn(e,t,i,6);break;case 8:jc(),lt=6;break e;default:throw Error(c(462))}}yx();break}catch(w){Gm(e,w)}while(!0);return Gl=Ba=null,ae.H=a,ae.A=n,qe=l,Te!==null?0:(Ve=null,Re=0,pu(),lt)}function yx(){for(;Te!==null&&!V();)Vm(Te)}function Vm(e){var t=sm(e.alternate,e,Kl);e.memoizedProps=e.pendingProps,t===null?cs(e):Te=t}function Zm(e){var t=e,l=t.alternate;switch(t.tag){case 15:case 0:t=em(l,t,t.pendingProps,t.type,void 0,Re);break;case 11:t=em(l,t,t.pendingProps,t.type.render,t.ref,Re);break;case 5:wr(t);var a=t;a===mt&&(_e?(Su(a),a.tag===5&&a.stateNode!=null&&(Ke=a.stateNode)):(Su(a),_e=!0));default:cm(l,t),t=Te=Uf(t,Kl),t=sm(l,t,Kl)}e.memoizedProps=e.pendingProps,t===null?cs(e):Te=t}function qn(e,t,l,a){Gl=Ba=null,wr(t),jn=null,Si=0;var n=t.return;try{if(ux(e,n,t,l,Re)){lt=1,Gu(e,tl(l,e.current)),Te=null;return}}catch(i){if(n!==null)throw Te=n,i;lt=1,Gu(e,tl(l,e.current)),Te=null;return}t.flags&32768?(_e||a===1?e=!0:wn||Re&536870912?e=!1:(ma=e=!0,(a===2||a===9||a===3||a===6)&&(a=yt.current,a!==null&&a.tag===13&&(a.flags|=16384))),Km(t,e)):cs(t)}function cs(e){var t=e;do{if(t.flags&32768){Km(t,ma);return}e=t.return;var l=ox(t.alternate,t,Kl);if(l!==null){Te=l;return}if(t=t.sibling,t!==null){Te=t;return}Te=t=e}while(t!==null);lt===0&&(lt=5)}function Km(e,t){do{var l=fx(e.alternate,e);if(l!==null){l.flags&=32767,Te=l;return}if(l=e.return,l!==null&&(l.flags|=32768,l.subtreeFlags=0,l.deletions=null),!t&&(e=e.sibling,e!==null)){Te=e;return}Te=e=l}while(e!==null);lt=6,Te=null}function Jm(e,t,l,a,n,i,r,f,x,E,w,H){e.cancelPendingCommit=null;do os();while(et!==0);if(qe&6)throw Error(c(327));if(t!==null){if(t===e.current)throw Error(c(177));e===Ve&&(Te=Ve=null,Re=0),Ia=t,pl=e,zl=l,_c=n,Hm=a,bx(e,t,l,r,f,x,H)}}function bx(e,t,l,a,n,i,r){var f=t.lanes|t.childLanes;if(Nc=f,f|=ur,Zp(e,l,f,a,n,i),Un=null,(l&335544064)===l?(Ln=Jg(e),a=10262):(Ln=null,a=10256),t.subtreeFlags&a||t.flags&a?(e.callbackNode=null,e.callbackPriority=0,Tx(Ue,function(){return Ac(),null})):(e.callbackNode=null,e.callbackPriority=0),$u=!1,a=(t.flags&13878)!==0,t.subtreeFlags&13878||a){a=ae.T,ae.T=null,n=ne.p,ne.p=2,i=qe,qe|=4;try{dx(e,t,l)}finally{qe=i,ne.p=n,ae.T=a}}et=1,$u?Dn=Zx(r,e.containerInfo,Ln,Tc,Cc,Nx,zc,Ac,Sx):(Tc(),Cc(),zc())}function Sx(e){if(et!==0){var t=pl.onRecoverableError;t(e,{componentStack:null})}}function Nx(){et===3&&(et=0,Rm(Ia,pl),et=4)}function Tc(){if(et===1){et=0;var e=pl,t=Ia,l=zl,a=(t.flags&13878)!==0;if(t.subtreeFlags&13878||a){a=ae.T,ae.T=null;var n=ne.p;ne.p=2;var i=qe;qe|=4;try{Mi=Wu=!1,zm(t,e,l),l=Gc;var r=Ef(e.containerInfo),f=l.focusedElem,x=l.selectionRange;if(r!==f&&f&&f.ownerDocument&&jf(f.ownerDocument.documentElement,f)){if(x!==null&&tr(f)){var E=x.start,w=x.end;if(w===void 0&&(w=E),"selectionStart"in f)f.selectionStart=E,f.selectionEnd=Math.min(w,f.value.length);else{var H=f.ownerDocument||document,_=H&&H.defaultView||window;if(_.getSelection){var O=_.getSelection(),$=f.textContent.length,te=Math.min(x.start,$),Se=x.end===void 0?te:Math.min(x.end,$);!O.extend&&te>Se&&(r=Se,Se=te,te=r);var j=_f(f,te),S=_f(f,Se);if(j&&S&&(O.rangeCount!==1||O.anchorNode!==j.node||O.anchorOffset!==j.offset||O.focusNode!==S.node||O.focusOffset!==S.offset)){var R=H.createRange();R.setStart(j.node,j.offset),O.removeAllRanges(),te>Se?(O.addRange(R),O.extend(S.node,S.offset)):(R.setEnd(S.node,S.offset),O.addRange(R))}}}}for(H=[],O=f;O=O.parentNode;)O.nodeType===1&&H.push({element:O,left:O.scrollLeft,top:O.scrollTop});for(typeof f.focus=="function"&&f.focus(),f=0;f<H.length;f++){var L=H[f];L.element.scrollLeft=L.left,L.element.scrollTop=L.top}}Kn=!!Yc,Gc=Yc=null}finally{qe=i,ne.p=n,ae.T=a}}e.current=t,et=2}}function Cc(){if(et===2){et=0;var e=pl,t=Ia,l=(t.flags&8772)!==0;if(t.subtreeFlags&8772||l){l=ae.T,ae.T=null;var a=ne.p;ne.p=2;var n=qe;qe|=4;try{Nm(e,t.alternate,t)}finally{qe=n,ne.p=a,ae.T=l}}et=3}}function zc(){if(et===4||et===3){et=0;var e=Dn;Dn=null,me();var t=pl,l=Ia,a=zl,n=Hm,i=(a&335544064)===a?10262:10256;if(l.subtreeFlags&i||l.flags&i?et=5:(et=0,Ia=pl=null,$m(t,t.pendingLanes)),i=t.pendingLanes,i===0&&(pa=null),Hs(a),l=l.stateNode,ft&&typeof ft.onCommitFiberRoot=="function")try{ft.onCommitFiberRoot(Et,l,void 0,(l.current.flags&128)===128)}catch{}if(n!==null){l=ae.T,i=ne.p,ne.p=2,ae.T=null;try{for(var r=t.onRecoverableError,f=0;f<n.length;f++){var x=n[f];r(x.value,{componentStack:x.stack})}}finally{ae.T=l,ne.p=i}}if(n=Un,r=Ln,Ln=null,n!==null&&(Un=null,r===null&&(r=[]),e!==null))for(x=0;x<n.length;x++)l=(0,n[x])(r),l!==void 0&&e.finished.finally(l);zl&3&&os(),Al(t),i=t.pendingLanes,a&261930&&i&42?t===us?Hi++:(Hi=0,us=t):(Hi=0,us=null),Bi(0)}}function $m(e,t){(e.pooledCacheLanes&=t)===0&&(t=e.pooledCache,t!=null&&(e.pooledCache=null,vi(t)))}function os(){return Dn!==null&&(Dn.skipTransition(),Dn=null),Tc(),Cc(),zc(),Ac()}function Ac(){if(et!==5)return!1;var e=pl,t=Nc;Nc=0;var l=Hs(zl),a=ae.T,n=ne.p;try{ne.p=32>l?32:l,ae.T=null,l=_c,_c=null;var i=pl,r=zl;if(et=0,Ia=pl=null,zl=0,qe&6)throw Error(c(331));var f=qe;if(qe|=4,Dm(i.current),Om(i,i.current,r,l),qe=f,Bi(0,!1),ft&&typeof ft.onPostCommitFiberRoot=="function")try{ft.onPostCommitFiberRoot(Et,i)}catch{}return!0}finally{ne.p=n,ae.T=a,$m(e,t)}}function Fm(e,t,l){t=tl(l,t),t=Zr(e.stateNode,t,2),e=sa(e,t,2),e!==null&&(ni(e,2),Al(e))}function ke(e,t,l){if(e.tag===3)Fm(e,e,l);else for(;t!==null;){if(t.tag===3){Fm(t,e,l);break}else if(t.tag===1){var a=t.stateNode;if(typeof t.type.getDerivedStateFromError=="function"||typeof a.componentDidCatch=="function"&&(pa===null||!pa.has(a))){e=tl(l,e),l=Zd(2),a=sa(t,l,2),a!==null&&(Kd(l,a,t,e),ni(a,2),Al(a));break}}t=t.return}}function Rc(e,t,l){var a=e.pingCache;if(a===null){a=e.pingCache=new px;var n=new Set;a.set(t,n)}else n=a.get(t),n===void 0&&(n=new Set,a.set(t,n));n.has(l)||(bc=!0,n.add(l),e=_x.bind(null,e,t,l),t.then(e,e))}function _x(e,t,l){var a=e.pingCache;a!==null&&a.delete(t),e.pingedLanes|=e.suspendedLanes&l,e.warmLanes&=~l,Ve===e&&(Re&l)===l&&(lt===4||lt===3&&(Re&62914560)===Re&&300>M()-as?qe&2?ls|=l:Bn(e,0):ls|=l,Mn===Re&&(Mn=0)),Al(e)}function Im(e,t){t===0&&(t=Uo()),e=Ua(e,t),e!==null&&(ni(e,t),Al(e))}function jx(e){var t=e.memoizedState,l=0;t!==null&&(l=t.retryLane),Im(e,l)}function Ex(e,t){var l=0;switch(e.tag){case 31:case 13:var a=e.stateNode,n=e.memoizedState;n!==null&&(l=n.retryLane);break;case 19:a=e.stateNode;break;case 22:a=e.stateNode._retryCache;break;default:throw Error(c(314))}a!==null&&a.delete(t),Im(e,l)}function Tx(e,t){return an(e,t)}var Yn=null,Gn=null,Oc=!1,fs=!1,wc=!1,xa=0;function Al(e){e!==Gn&&e.next===null&&(Gn===null?Yn=Gn=e:Gn=Gn.next=e),fs=!0,Oc||(Oc=!0,zx())}function Bi(e,t){if(!wc&&fs){wc=!0;do for(var l=!1,a=Yn;a!==null;){if(e!==0){var n=a.pendingLanes;if(n===0)var i=0;else{var r=a.suspendedLanes,f=a.pingedLanes;i=(1<<31-it(42|e)+1)-1,i&=n&~(r&~f),i=i&201326741?i&201326741|1:i?i|2:0}i!==0&&(l=!0,th(a,i))}else i=Re,i=lu(a,a===Ve?i:0,a.cancelPendingCommit!==null||a.timeoutHandle!==-1),!(i&3)||ai(a,i)||(l=!0,th(a,i));a=a.next}while(l);wc=!1}}function Cx(){Wm()}function Wm(){fs=Oc=!1;var e=0;xa!==0&&qx()&&(e=xa);for(var t=M(),l=null,a=Yn;a!==null;){var n=a.next,i=Pm(a,t);i===0?(a.next=null,l===null?Yn=n:l.next=n,n===null&&(Gn=l)):(l=a,(e!==0||i&3)&&(fs=!0)),a=n}et!==0&&et!==5||Bi(e),xa!==0&&(xa=0)}function Pm(e,t){for(var l=e.suspendedLanes,a=e.pingedLanes,n=e.expirationTimes,i=e.pendingLanes&-62914561;0<i;){var r=31-it(i),f=1<<r,x=n[r];x===-1?(!(f&l)||f&a)&&(n[r]=Vp(f,t)):x<=t&&(e.expiredLanes|=f),i&=~f}if(t=Ve,l=Re,l=lu(e,e===t?l:0,e.cancelPendingCommit!==null||e.timeoutHandle!==-1),a=e.callbackNode,l===0||e===t&&(Ge===2||Ge===9)||e.cancelPendingCommit!==null)return a!==null&&a!==null&&Ta(a),e.callbackNode=null,e.callbackPriority=0;if(!(l&3)||ai(e,l)){if(t=l&-l,t===e.callbackPriority)return t;switch(a!==null&&Ta(a),Hs(l)){case 2:case 8:l=ve;break;case 32:l=Ue;break;case 268435456:l=he;break;default:l=Ue}return a=eh.bind(null,e),l=an(l,a),e.callbackPriority=t,e.callbackNode=l,t}return a!==null&&a!==null&&Ta(a),e.callbackPriority=2,e.callbackNode=null,2}function eh(e,t){if(et!==0&&et!==5)return e.callbackNode=null,e.callbackPriority=0,null;var l=e.callbackNode;if(os()&&e.callbackNode!==l)return null;var a=Re;return a=lu(e,e===Ve?a:0,e.cancelPendingCommit!==null||e.timeoutHandle!==-1),a===0?null:(qm(e,a,t),Pm(e,M()),e.callbackNode!=null&&e.callbackNode===l?eh.bind(null,e):null)}function th(e,t){if(os())return null;qm(e,t,!0)}function zx(){Gx(function(){qe&6?an(X,Cx):Wm()})}function Mc(){if(xa===0){var e=Ga;e===0&&(e=Ca,Ca<<=1,!(Ca&261888)&&(Ca=256)),xa=e}return xa}function lh(e){return e==null||typeof e=="symbol"||typeof e=="boolean"?null:typeof e=="function"?e:su(e)}function Ax(e,t,l,a,n){if(t==="submit"&&l&&l.stateNode===n){var i=lh((n[Mt]||null).action),r=a.submitter;r&&(t=(t=r[Mt]||null)?lh(t.formAction):r.getAttribute("formAction"),t!==null&&(i=t,r=null));var f=new fu("action","action",null,a,n);e.push({event:f,listeners:[{instance:null,listener:function(){if(a.defaultPrevented){if(xa!==0){var x=new FormData(n,r);Gr(l,{pending:!0,data:x,method:n.method,action:i},null,x)}}else typeof i=="function"&&(f.preventDefault(),x=new FormData(n,r),Gr(l,{pending:!0,data:x,method:n.method,action:i},i,x))},currentTarget:n}]})}}for(var Dc=0;Dc<ir.length;Dc++){var Uc=ir[Dc],Rx=Uc.toLowerCase(),Ox=Uc[0].toUpperCase()+Uc.slice(1);fl(Rx,"on"+Ox)}fl(zf,"onAnimationEnd"),fl(Af,"onAnimationIteration"),fl(Rf,"onAnimationStart"),fl("dblclick","onDoubleClick"),fl("focusin","onFocus"),fl("focusout","onBlur"),fl(Yg,"onTransitionRun"),fl(Gg,"onTransitionStart"),fl(kg,"onTransitionCancel"),fl(Of,"onTransitionEnd"),cn("onMouseEnter",["mouseout","mouseover"]),cn("onMouseLeave",["mouseout","mouseover"]),cn("onPointerEnter",["pointerout","pointerover"]),cn("onPointerLeave",["pointerout","pointerover"]),wa("onChange","change click focusin focusout input keydown keyup selectionchange".split(" ")),wa("onSelect","focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange".split(" ")),wa("onBeforeInput",["compositionend","keypress","textInput","paste"]),wa("onCompositionEnd","compositionend focusout keydown keypress keyup mousedown".split(" ")),wa("onCompositionStart","compositionstart focusout keydown keypress keyup mousedown".split(" ")),wa("onCompositionUpdate","compositionupdate focusout keydown keypress keyup mousedown".split(" "));var qi="abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange resize seeked seeking stalled suspend timeupdate volumechange waiting".split(" "),wx=new Set("beforetoggle cancel close invalid load scroll scrollend toggle".split(" ").concat(qi));function ah(e,t){t=(t&4)!==0;for(var l=0;l<e.length;l++){var a=e[l],n=a.event;a=a.listeners;e:{var i=void 0;if(t)for(var r=a.length-1;0<=r;r--){var f=a[r],x=f.instance,E=f.currentTarget;if(f=f.listener,x!==i&&n.isPropagationStopped())break e;i=f,n.currentTarget=E;try{i(n)}catch(w){hu(w)}n.currentTarget=null,i=x}else for(r=0;r<a.length;r++){if(f=a[r],x=f.instance,E=f.currentTarget,f=f.listener,x!==i&&n.isPropagationStopped())break e;i=f,n.currentTarget=E;try{i(n)}catch(w){hu(w)}n.currentTarget=null,i=x}}}}function Ce(e,t){var l=t[Go];l===void 0&&(l=t[Go]=new Set);var a=e+"__bubble";l.has(a)||(nh(t,e,2,!1),l.add(a))}function Lc(e,t,l){var a=0;t&&(a|=4),nh(l,e,a,t)}var ds="_reactListening"+Math.random().toString(36).slice(2);function Hc(e){if(!e[ds]){e[ds]=!0,Xo.forEach(function(l){l!=="selectionchange"&&(wx.has(l)||Lc(l,!1,e),Lc(l,!0,e))});var t=e.nodeType===9?e:e.ownerDocument;t===null||t[ds]||(t[ds]=!0,Lc("selectionchange",!1,t))}}function nh(e,t,l,a){switch(Kh(t)){case 2:var n=jv;break;case 8:n=Ev;break;default:n=ao}l=n.bind(null,t,l,e),n=void 0,!Vs||t!=="touchstart"&&t!=="touchmove"&&t!=="wheel"||(n=!0),a?n!==void 0?e.addEventListener(t,l,{capture:!0,passive:n}):e.addEventListener(t,l,!0):n!==void 0?e.addEventListener(t,l,{passive:n}):e.addEventListener(t,l,!1)}function Bc(e,t,l,a,n){var i=a;if(!(t&1)&&!(t&2)&&a!==null)e:for(;;){if(a===null)return;var r=a.tag;if(r===3||r===4){var f=a.stateNode.containerInfo;if(f===n)break;if(r===4)for(r=a.return;r!==null;){var x=r.tag;if((x===3||x===4)&&r.stateNode.containerInfo===n)return;r=r.return}for(;f!==null;){if(r=Oa(f),r===null)return;if(x=r.tag,x===5||x===6||x===26||x===27){a=i=r;continue e}f=f.parentNode}}a=a.return}af(function(){var E=i,w=Qs(l),H=[];e:{var _=wf.get(e);if(_!==void 0){var O=fu,$=e;switch(e){case"keypress":if(cu(l)===0)break e;case"keydown":case"keyup":O=gg;break;case"focusin":$="focus",O=$s;break;case"focusout":$="blur",O=$s;break;case"beforeblur":case"afterblur":O=$s;break;case"click":if(l.button===2)break e;case"auxclick":case"dblclick":case"mousedown":case"mousemove":case"mouseup":case"mouseout":case"mouseover":case"contextmenu":O=sf;break;case"drag":case"dragend":case"dragenter":case"dragexit":case"dragleave":case"dragover":case"dragstart":case"drop":O=ng;break;case"touchcancel":case"touchend":case"touchmove":case"touchstart":O=Sg;break;case zf:case Af:case Rf:O=sg;break;case Of:O=_g;break;case"scroll":case"scrollend":O=lg;break;case"wheel":O=Eg;break;case"copy":case"cut":case"paste":O=cg;break;case"gotpointercapture":case"lostpointercapture":case"pointercancel":case"pointerdown":case"pointermove":case"pointerout":case"pointerover":case"pointerup":O=cf;break;case"submit":O=yg;break;case"toggle":case"beforetoggle":O=Cg}var te=(t&4)!==0,Se=!te&&(e==="scroll"||e==="scrollend"),j=te?_!==null?_+"Capture":null:_;te=[];for(var S=E,R;S!==null;){var L=S;if(R=L.stateNode,L=L.tag,L!==5&&L!==26&&L!==27||R===null||j===null||(L=si(S,j),L!=null&&te.push(Yi(S,L,R))),Se)break;S=S.return}0<te.length&&(_=new O(_,$,null,l,w),H.push({event:_,listeners:te}))}}if(!(t&7)){e:{if(O=e==="mouseover"||e==="pointerover",_=e==="mouseout"||e==="pointerout",O&&l!==ks&&($=l.relatedTarget||l.fromElement)&&(Oa($)||$[un]))break e;(_||O)&&($=w.window===w?w:(O=w.ownerDocument)?O.defaultView||O.parentWindow:window,_?(O=l.relatedTarget||l.toElement,_=E,O=O?Oa(O):null,O!==null&&(Se=p(O),te=O.tag,O!==Se||te!==5&&te!==27&&te!==6)&&(O=null)):(_=null,O=E),_!==O&&(te=sf,L="onMouseLeave",j="onMouseEnter",S="mouse",(e==="pointerout"||e==="pointerover")&&(te=cf,L="onPointerLeave",j="onPointerEnter",S="pointer"),Se=_==null?$:ui(_),R=O==null?$:ui(O),$=new te(L,S+"leave",_,l,w),$.target=Se,$.relatedTarget=R,L=null,Oa(w)===E&&(te=new te(j,S+"enter",O,l,w),te.target=R,te.relatedTarget=Se,L=te),Se=L,te=_&&O?xe(_,O,Mx):null,_!==null&&ih(H,$,_,te,!1),O!==null&&Se!==null&&ih(H,Se,O,te,!0)))}e:{if(_=E?ui(E):window,O=_.nodeName&&_.nodeName.toLowerCase(),O==="select"||O==="input"&&_.type==="file")var W=xf;else if(pf(_))if(vf)W=Hg;else{W=Ug;var Oe=Dg}else O=_.nodeName,!O||O.toLowerCase()!=="input"||_.type!=="checkbox"&&_.type!=="radio"?E&&Gs(E.elementType)&&(W=xf):W=Lg;if(W&&(W=W(e,E))){gf(H,W,l,w);break e}Oe&&Oe(e,_,E)}switch(Oe=E?ui(E):window,e){case"focusin":(pf(Oe)||Oe.contentEditable==="true")&&(pn=Oe,lr=E,pi=null);break;case"focusout":pi=lr=pn=null;break;case"mousedown":ar=!0;break;case"contextmenu":case"mouseup":case"dragend":ar=!1,Tf(H,l,w);break;case"selectionchange":if(qg)break;case"keydown":case"keyup":Tf(H,l,w)}var oe;if(Is)e:{switch(e){case"compositionstart":var pe="onCompositionStart";break e;case"compositionend":pe="onCompositionEnd";break e;case"compositionupdate":pe="onCompositionUpdate";break e}pe=void 0}else hn?mf(e,l)&&(pe="onCompositionEnd"):e==="keydown"&&l.keyCode===229&&(pe="onCompositionStart");pe&&(of&&l.locale!=="ko"&&(hn||pe!=="onCompositionStart"?pe==="onCompositionEnd"&&hn&&(oe=nf()):(Wl=w,Zs="value"in Wl?Wl.value:Wl.textContent,hn=!0)),Oe=ms(E,pe),0<Oe.length&&(pe=new rf(pe,e,null,l,w),H.push({event:pe,listeners:Oe}),oe?pe.data=oe:(oe=hf(l),oe!==null&&(pe.data=oe)))),(oe=Ag?Rg(e,l):Og(e,l))&&(pe=ms(E,"onBeforeInput"),0<pe.length&&(Oe=new rf("onBeforeInput","beforeinput",null,l,w),H.push({event:Oe,listeners:pe}),Oe.data=oe)),Ax(H,e,E,l,w)}ah(H,t)})}function Yi(e,t,l){return{instance:e,listener:t,currentTarget:l}}function ms(e,t){for(var l=t+"Capture",a=[];e!==null;){var n=e,i=n.stateNode;if(n=n.tag,n!==5&&n!==26&&n!==27||i===null||(n=si(e,l),n!=null&&a.unshift(Yi(e,n,i)),n=si(e,t),n!=null&&a.push(Yi(e,n,i))),e.tag===3)return a;e=e.return}return[]}function Mx(e){if(e===null)return null;do e=e.return;while(e&&e.tag!==5&&e.tag!==27);return e||null}function ih(e,t,l,a,n){for(var i=t._reactName,r=[];l!==null&&l!==a;){var f=l,x=f.alternate,E=f.stateNode;if(f=f.tag,x!==null&&x===a)break;f!==5&&f!==26&&f!==27||E===null||(x=E,n?(E=si(l,i),E!=null&&r.unshift(Yi(l,E,x))):n||(E=si(l,i),E!=null&&r.push(Yi(l,E,x)))),l=l.return}r.length!==0&&e.push({event:t,listeners:r})}var Dx=/\r\n?/g,Ux=/\u0000|\uFFFD/g;function uh(e){return(typeof e=="string"?e:""+e).replace(Dx,`
`).replace(Ux,"")}function sh(e,t){return t=uh(t),uh(e)===t}function Qe(e,t,l,a,n,i){switch(l){case"children":if(typeof a=="string")t==="body"||t==="textarea"&&a===""||fn(e,a);else if(typeof a=="number"||typeof a=="bigint")t!=="body"&&fn(e,""+a);else return;break;case"className":uu(e,"class",a);break;case"tabIndex":uu(e,"tabindex",a);break;case"dir":case"role":case"viewBox":case"width":case"height":uu(e,l,a);break;case"style":tf(e,a,i);return;case"data":if(t!=="object"){uu(e,"data",a);break}case"src":case"href":if(a===""&&(t!=="a"||l!=="href")){e.removeAttribute(l);break}if(a==null||typeof a=="function"||typeof a=="symbol"||typeof a=="boolean"){e.removeAttribute(l);break}a=su(a),e.setAttribute(l,a);break;case"action":case"formAction":if(typeof a=="function"){e.setAttribute(l,"javascript:throw new Error('A React form was unexpectedly submitted. If you called form.submit() manually, consider using form.requestSubmit() instead. If you\\'re trying to use event.stopPropagation() in a submit event handler, consider also calling event.preventDefault().')");break}else typeof i=="function"&&(l==="formAction"?(t!=="input"&&Qe(e,t,"name",n.name,n,null),Qe(e,t,"formEncType",n.formEncType,n,null),Qe(e,t,"formMethod",n.formMethod,n,null),Qe(e,t,"formTarget",n.formTarget,n,null)):(Qe(e,t,"encType",n.encType,n,null),Qe(e,t,"method",n.method,n,null),Qe(e,t,"target",n.target,n,null)));if(a==null||typeof a=="symbol"||typeof a=="boolean"){e.removeAttribute(l);break}a=su(a),e.setAttribute(l,a);break;case"onClick":a!=null&&(e.onclick=yl);return;case"onScroll":a!=null&&Ce("scroll",e);return;case"onScrollEnd":a!=null&&Ce("scrollend",e);return;case"dangerouslySetInnerHTML":if(a!=null){if(typeof a!="object"||!("__html"in a))throw Error(c(61));if(l=a.__html,l!=null){if(n.children!=null)throw Error(c(60));(i!=null?i.__html:void 0)!==l&&(e.innerHTML=l)}}break;case"multiple":e.multiple=a&&typeof a!="function"&&typeof a!="symbol";break;case"muted":e.muted=a&&typeof a!="function"&&typeof a!="symbol";break;case"suppressContentEditableWarning":case"suppressHydrationWarning":case"defaultValue":case"defaultChecked":case"innerHTML":case"ref":break;case"autoFocus":break;case"xlinkHref":if(a==null||typeof a=="function"||typeof a=="boolean"||typeof a=="symbol"){e.removeAttribute("xlink:href");break}l=su(a),e.setAttributeNS("http://www.w3.org/1999/xlink","xlink:href",l);break;case"contentEditable":case"spellCheck":case"draggable":case"value":case"autoReverse":case"externalResourcesRequired":case"focusable":case"preserveAlpha":a!=null&&typeof a!="function"&&typeof a!="symbol"?e.setAttribute(l,a):e.removeAttribute(l);break;case"inert":case"allowFullScreen":case"async":case"autoPlay":case"controls":case"credentialless":case"default":case"defer":case"disabled":case"disablePictureInPicture":case"disableRemotePlayback":case"formNoValidate":case"hidden":case"loop":case"noModule":case"noValidate":case"open":case"playsInline":case"readOnly":case"required":case"reversed":case"scoped":case"seamless":case"itemScope":a&&typeof a!="function"&&typeof a!="symbol"?e.setAttribute(l,""):e.removeAttribute(l);break;case"capture":case"download":a===!0?e.setAttribute(l,""):a!==!1&&a!=null&&typeof a!="function"&&typeof a!="symbol"?e.setAttribute(l,a):e.removeAttribute(l);break;case"cols":case"rows":case"size":case"span":a!=null&&typeof a!="function"&&typeof a!="symbol"&&!isNaN(a)&&1<=a?e.setAttribute(l,a):e.removeAttribute(l);break;case"rowSpan":case"start":a==null||typeof a=="function"||typeof a=="symbol"||isNaN(a)?e.removeAttribute(l):e.setAttribute(l,a);break;case"popover":Ce("beforetoggle",e),Ce("toggle",e),iu(e,"popover",a);break;case"xlinkActuate":Ul(e,"http://www.w3.org/1999/xlink","xlink:actuate",a);break;case"xlinkArcrole":Ul(e,"http://www.w3.org/1999/xlink","xlink:arcrole",a);break;case"xlinkRole":Ul(e,"http://www.w3.org/1999/xlink","xlink:role",a);break;case"xlinkShow":Ul(e,"http://www.w3.org/1999/xlink","xlink:show",a);break;case"xlinkTitle":Ul(e,"http://www.w3.org/1999/xlink","xlink:title",a);break;case"xlinkType":Ul(e,"http://www.w3.org/1999/xlink","xlink:type",a);break;case"xmlBase":Ul(e,"http://www.w3.org/XML/1998/namespace","xml:base",a);break;case"xmlLang":Ul(e,"http://www.w3.org/XML/1998/namespace","xml:lang",a);break;case"xmlSpace":Ul(e,"http://www.w3.org/XML/1998/namespace","xml:space",a);break;case"is":iu(e,"is",a);break;case"innerText":case"textContent":return;default:if(!(2<l.length)||l[0]!=="o"&&l[0]!=="O"||l[1]!=="n"&&l[1]!=="N")l=eg.get(l)||l,iu(e,l,a);else return}Le=!0}function qc(e,t,l,a,n,i){switch(l){case"style":tf(e,a,i);return;case"dangerouslySetInnerHTML":if(a!=null){if(typeof a!="object"||!("__html"in a))throw Error(c(61));if(l=a.__html,l!=null){if(n.children!=null)throw Error(c(60));(i!=null?i.__html:void 0)!==l&&(e.innerHTML=l)}}break;case"children":if(typeof a=="string")fn(e,a);else if(typeof a=="number"||typeof a=="bigint")fn(e,""+a);else return;break;case"onScroll":a!=null&&Ce("scroll",e);return;case"onScrollEnd":a!=null&&Ce("scrollend",e);return;case"onClick":a!=null&&(e.onclick=yl);return;case"suppressContentEditableWarning":case"suppressHydrationWarning":case"innerHTML":case"ref":return;case"innerText":case"textContent":return;default:if(!Vo.hasOwnProperty(l))e:{if(l[0]==="o"&&l[1]==="n"&&(n=l.endsWith("Capture"),i=l.slice(2,n?l.length-7:void 0),t=e[Mt]||null,t=t!=null?t[l]:null,typeof t=="function"&&e.removeEventListener(i,t,n),typeof a=="function")){typeof t!="function"&&t!==null&&(l in e?e[l]=null:e.hasAttribute(l)&&e.removeAttribute(l)),e.addEventListener(i,a,n);break e}Le=!0,l in e?e[l]=a:a===!0?e.setAttribute(l,""):iu(e,l,a)}return}Le=!0}function Nt(e,t,l){switch(t){case"div":case"span":case"svg":case"path":case"a":case"g":case"p":case"li":break;case"img":Ce("error",e),Ce("load",e);var a=!1,n=!1,i;for(i in l)if(l.hasOwnProperty(i)){var r=l[i];if(r!=null)switch(i){case"src":a=!0;break;case"srcSet":n=!0;break;case"children":case"dangerouslySetInnerHTML":throw Error(c(137,t));default:Qe(e,t,i,r,l,null)}}n&&Qe(e,t,"srcSet",l.srcSet,l,null),a&&Qe(e,t,"src",l.src,l,null);return;case"input":Ce("invalid",e);var f=i=r=n=null,x=null,E=null;for(a in l)if(l.hasOwnProperty(a)){var w=l[a];if(w!=null)switch(a){case"name":n=w;break;case"type":r=w;break;case"checked":x=w;break;case"defaultChecked":E=w;break;case"value":i=w;break;case"defaultValue":f=w;break;case"children":case"dangerouslySetInnerHTML":if(w!=null)throw Error(c(137,t));break;default:Qe(e,t,a,w,l,null)}}Io(e,i,f,x,E,r,n,!1);return;case"select":Ce("invalid",e),a=r=i=null;for(n in l)if(l.hasOwnProperty(n)&&(f=l[n],f!=null))switch(n){case"value":i=f;break;case"defaultValue":r=f;break;case"multiple":a=f;default:Qe(e,t,n,f,l,null)}t=i,l=r,e.multiple=!!a,t!=null?on(e,!!a,t,!1):l!=null&&on(e,!!a,l,!0);return;case"textarea":Ce("invalid",e),i=n=a=null;for(r in l)if(l.hasOwnProperty(r)&&(f=l[r],f!=null))switch(r){case"value":a=f;break;case"defaultValue":n=f;break;case"children":i=f;break;case"dangerouslySetInnerHTML":if(f!=null)throw Error(c(91));break;default:Qe(e,t,r,f,l,null)}Po(e,a,n,i);return;case"option":for(x in l)if(l.hasOwnProperty(x)&&(a=l[x],a!=null))switch(x){case"selected":e.selected=a&&typeof a!="function"&&typeof a!="symbol";break;default:Qe(e,t,x,a,l,null)}return;case"dialog":Ce("beforetoggle",e),Ce("toggle",e),Ce("cancel",e),Ce("close",e);break;case"iframe":case"object":Ce("load",e);break;case"video":case"audio":for(a=0;a<qi.length;a++)Ce(qi[a],e);break;case"image":Ce("error",e),Ce("load",e);break;case"details":Ce("toggle",e);break;case"embed":case"source":case"link":Ce("error",e),Ce("load",e);case"area":case"base":case"br":case"col":case"hr":case"keygen":case"meta":case"param":case"track":case"wbr":case"menuitem":for(E in l)if(l.hasOwnProperty(E)&&(a=l[E],a!=null))switch(E){case"children":case"dangerouslySetInnerHTML":throw Error(c(137,t));default:Qe(e,t,E,a,l,null)}return;default:if(Gs(t)){for(w in l)l.hasOwnProperty(w)&&(a=l[w],a!==void 0&&qc(e,t,w,a,l,void 0));return}}for(f in l)l.hasOwnProperty(f)&&(a=l[f],a!=null&&Qe(e,t,f,a,l,null))}var Lx={};function Hx(e,t,l,a){switch(t){case"div":case"span":case"svg":case"path":case"a":case"g":case"p":case"li":break;case"input":var n=null,i=null,r=null,f=null,x=null,E=null,w=null;for(O in l){var H=l[O];if(l.hasOwnProperty(O)&&H!=null)switch(O){case"checked":break;case"value":break;case"defaultValue":x=H;default:a.hasOwnProperty(O)||Qe(e,t,O,null,a,H)}}for(var _ in a){var O=a[_];if(H=l[_],a.hasOwnProperty(_)&&(O!=null||H!=null))switch(_){case"type":O!==H&&(Le=!0),i=O;break;case"name":O!==H&&(Le=!0),n=O;break;case"checked":O!==H&&(Le=!0),E=O;break;case"defaultChecked":O!==H&&(Le=!0),w=O;break;case"value":O!==H&&(Le=!0),r=O;break;case"defaultValue":O!==H&&(Le=!0),f=O;break;case"children":case"dangerouslySetInnerHTML":if(O!=null)throw Error(c(137,t));break;default:O!==H&&Qe(e,t,_,O,a,H)}}qs(e,r,f,x,E,w,i,n);return;case"select":O=r=f=_=null;for(i in l)if(x=l[i],l.hasOwnProperty(i)&&x!=null)switch(i){case"value":break;case"multiple":O=x;default:a.hasOwnProperty(i)||Qe(e,t,i,null,a,x)}for(n in a)if(i=a[n],x=l[n],a.hasOwnProperty(n)&&(i!=null||x!=null))switch(n){case"value":i!==x&&(Le=!0),_=i;break;case"defaultValue":i!==x&&(Le=!0),f=i;break;case"multiple":i!==x&&(Le=!0),r=i;default:i!==x&&Qe(e,t,n,i,a,x)}t=f,l=r,a=O,_!=null?on(e,!!l,_,!1):!!a!=!!l&&(t!=null?on(e,!!l,t,!0):on(e,!!l,l?[]:"",!1));return;case"textarea":O=_=null;for(f in l)if(n=l[f],l.hasOwnProperty(f)&&n!=null&&!a.hasOwnProperty(f))switch(f){case"value":break;case"children":break;default:Qe(e,t,f,null,a,n)}for(r in a)if(n=a[r],i=l[r],a.hasOwnProperty(r)&&(n!=null||i!=null))switch(r){case"value":n!==i&&(Le=!0),_=n;break;case"defaultValue":n!==i&&(Le=!0),O=n;break;case"children":break;case"dangerouslySetInnerHTML":if(n!=null)throw Error(c(91));break;default:n!==i&&Qe(e,t,r,n,a,i)}Wo(e,_,O);return;case"option":for(var $ in l)if(_=l[$],l.hasOwnProperty($)&&_!=null&&!a.hasOwnProperty($))switch($){case"selected":e.selected=!1;break;default:Qe(e,t,$,null,a,_)}for(x in a)if(_=a[x],O=l[x],a.hasOwnProperty(x)&&_!==O&&(_!=null||O!=null))switch(x){case"selected":_!==O&&(Le=!0),e.selected=_&&typeof _!="function"&&typeof _!="symbol";break;default:Qe(e,t,x,_,a,O)}return;case"img":case"link":case"area":case"base":case"br":case"col":case"embed":case"hr":case"keygen":case"meta":case"param":case"source":case"track":case"wbr":case"menuitem":for(var te in l)_=l[te],l.hasOwnProperty(te)&&_!=null&&!a.hasOwnProperty(te)&&Qe(e,t,te,null,a,_);for(E in a)if(_=a[E],O=l[E],a.hasOwnProperty(E)&&_!==O&&(_!=null||O!=null))switch(E){case"children":case"dangerouslySetInnerHTML":if(_!=null)throw Error(c(137,t));break;default:Qe(e,t,E,_,a,O)}return;default:if(Gs(t)){for(var Se in l)_=l[Se],l.hasOwnProperty(Se)&&_!==void 0&&!a.hasOwnProperty(Se)&&qc(e,t,Se,void 0,a,_);for(w in a)_=a[w],O=l[w],!a.hasOwnProperty(w)||_===O||_===void 0&&O===void 0||qc(e,t,w,_,a,O);return}}for(var j in l)_=l[j],l.hasOwnProperty(j)&&_!=null&&!a.hasOwnProperty(j)&&Qe(e,t,j,null,a,_);for(H in a)_=a[H],O=l[H],!a.hasOwnProperty(H)||_===O||_==null&&O==null||Qe(e,t,H,_,a,O)}function rh(e){switch(e){case"css":case"script":case"font":case"img":case"image":case"input":case"link":return!0;default:return!1}}function Bx(){if(typeof performance.getEntriesByType=="function"){for(var e=0,t=0,l=performance.getEntriesByType("resource"),a=0;a<l.length;a++){var n=l[a],i=n.transferSize,r=n.initiatorType,f=n.duration;if(i&&f&&rh(r)){for(r=0,f=n.responseEnd,a+=1;a<l.length;a++){var x=l[a],E=x.startTime;if(E>f)break;var w=x.transferSize,H=x.initiatorType;w&&rh(H)&&(x=x.responseEnd,r+=w*(x<f?1:(f-E)/(x-E)))}if(--a,t+=8*(i+r)/(n.duration/1e3),e++,10<e)break}}if(0<e)return t/e/1e6}return navigator.connection&&(e=navigator.connection.downlink,typeof e=="number")?e:5}var Yc=null,Gc=null;function Gi(e){return e.nodeType===9?e:e.ownerDocument}function ch(e){switch(e){case"http://www.w3.org/2000/svg":return 1;case"http://www.w3.org/1998/Math/MathML":return 2;default:return 0}}function oh(e,t){if(e===0)switch(t){case"svg":return 1;case"math":return 2;default:return 0}return e===1&&t==="foreignObject"?0:e}function fh(e,t,l,a){return l=Gi(l).createElement(e),l[xt]=a,l[Mt]=t,Nt(l,e,t),dt(l),l}function kc(e,t){return e==="textarea"||e==="noscript"||typeof t.children=="string"||typeof t.children=="number"||typeof t.children=="bigint"||typeof t.dangerouslySetInnerHTML=="object"&&t.dangerouslySetInnerHTML!==null&&t.dangerouslySetInnerHTML.__html!=null}var Qc=null;function qx(){var e=window.event;return e&&e.type==="popstate"?e===Qc?!1:(Qc=e,!0):(Qc=null,!1)}var Xc=typeof setTimeout=="function"?setTimeout:void 0,Yx=typeof clearTimeout=="function"?clearTimeout:void 0,dh=typeof Promise=="function"?Promise:void 0,mh=typeof requestAnimationFrame=="function"?requestAnimationFrame:Xc,Gx=typeof queueMicrotask=="function"?queueMicrotask:typeof dh<"u"?function(e){return dh.resolve(null).then(e).catch(kx)}:Xc;function kx(e){setTimeout(function(){throw e})}function va(e){return e==="head"}function hh(e,t){var l=t,a=0;do{var n=l.nextSibling;if(e.removeChild(l),n&&n.nodeType===8)if(l=n.data,l==="/$"||l==="/&"){if(a===0){e.removeChild(n),Jn(t);return}a--}else if(l==="$"||l==="$?"||l==="$~"||l==="$!"||l==="&")a++;else if(l==="html")Wc(e.ownerDocument.documentElement);else if(l==="head"){l=e.ownerDocument.head,Wc(l);for(var i=l.firstChild;i;){var r=i.nextSibling,f=i.nodeName;i[ii]||f==="SCRIPT"||f==="STYLE"||f==="LINK"&&i.rel.toLowerCase()==="stylesheet"||l.removeChild(i),i=r}}else l==="body"&&Wc(e.ownerDocument.body);l=n}while(l);Jn(t)}function ph(e,t){var l=e;e=0;do{var a=l.nextSibling;if(l.nodeType===1?t?(l._stashedDisplay=l.style.display,l.style.display="none"):(l.style.display=l._stashedDisplay||"",l.getAttribute("style")===""&&l.removeAttribute("style")):l.nodeType===3&&(t?(l._stashedText=l.nodeValue,l.nodeValue=""):l.nodeValue=l._stashedText||""),a&&a.nodeType===8)if(l=a.data,l==="/$"){if(e===0)break;e--}else l!=="$"&&l!=="$?"&&l!=="$~"&&l!=="$!"||e++;l=a}while(l)}function gh(e,t,l){if(t=CSS.escape(t)!==t?"r-"+btoa(t).replace(/=/g,""):t,e.style.viewTransitionName=t,l!=null&&(e.style.viewTransitionClass=l),l=getComputedStyle(e),l.display==="inline"){if(t=e.getClientRects(),t.length===1)var a=1;else for(var n=a=0;n<t.length;n++){var i=t[n];0<i.width&&0<i.height&&a++}a===1&&(e=e.style,e.display=t.length===1?"inline-block":"block",e.marginTop="-"+l.paddingTop,e.marginBottom="-"+l.paddingBottom)}}function xh(e,t){e=e.style,t=t.style;var l=t!=null?t.hasOwnProperty("viewTransitionName")?t.viewTransitionName:t.hasOwnProperty("view-transition-name")?t["view-transition-name"]:null:null;e.viewTransitionName=l==null||typeof l=="boolean"?"":(""+l).trim(),l=t!=null?t.hasOwnProperty("viewTransitionClass")?t.viewTransitionClass:t.hasOwnProperty("view-transition-class")?t["view-transition-class"]:null:null,e.viewTransitionClass=l==null||typeof l=="boolean"?"":(""+l).trim(),e.display==="inline-block"&&(t==null?e.display=e.margin="":(l=t.display,e.display=l==null||typeof l=="boolean"?"":l,l=t.margin,l!=null?e.margin=l:(l=t.hasOwnProperty("marginTop")?t.marginTop:t["margin-top"],e.marginTop=l==null||typeof l=="boolean"?"":l,t=t.hasOwnProperty("marginBottom")?t.marginBottom:t["margin-bottom"],e.marginBottom=t==null||typeof t=="boolean"?"":t)))}function Qx(e,t,l){return l=l.ownerDocument.defaultView,{rect:e,abs:t.position==="absolute"||t.position==="fixed",clip:t.clipPath!=="none"||t.overflow!=="visible"||t.filter!=="none"||t.mask!=="none"||t.mask!=="none"||t.borderRadius!=="0px",view:0<=e.bottom&&0<=e.right&&e.top<=l.innerHeight&&e.left<=l.innerWidth}}function Vc(e){var t=e.getBoundingClientRect(),l=getComputedStyle(e);return Qx(t,l,e)}function Xx(e){return e.documentElement.clientHeight}function Vx(e){this.addEventListener("load",e),this.addEventListener("error",e)}function Zx(e,t,l,a,n,i,r,f,x){var E=t.nodeType===9?t:t.ownerDocument;try{var w=E.startViewTransition({update:function(){var _=E.defaultView,O=_.navigation&&_.navigation.transition,$=E.fonts.status;a();var te=[];if($==="loaded"&&(Xx(E),E.fonts.status==="loading"&&te.push(E.fonts.ready)),$=te.length,e!==null)for(var Se=e.suspenseyImages,j=0,S=0;S<Se.length;S++){var R=Se[S];if(!R.complete){var L=R.getBoundingClientRect();if(0<L.bottom&&0<L.right&&L.top<_.innerHeight&&L.left<_.innerWidth){if(j+=Bh(R),j>gs){te.length=$;break}R=new Promise(Vx.bind(R)),te.push(R)}}}if(0<te.length)return _=Promise.race([Promise.all(te),new Promise(function(W){return setTimeout(W,500)})]).then(n,n),(O?Promise.allSettled([O.finished,_]):_).then(i,i);if(n(),O)return O.finished.then(i,i);i()},types:l});E.__reactViewTransition=w;var H=[];return w.ready.then(function(){for(var _=E.documentElement.getAnimations({subtree:!0}),O=0;O<_.length;O++){var $=_[O],te=$.effect,Se=te.pseudoElement;if(Se!=null&&Se.startsWith("::view-transition")){H.push($),$=te.getKeyframes();for(var j=Se=void 0,S=!0,R=0;R<$.length;R++){var L=$[R],W=L.width;if(Se===void 0)Se=W;else if(Se!==W){S=!1;break}if(W=L.height,j===void 0)j=W;else if(j!==W){S=!1;break}delete L.width,delete L.height,L.transform==="none"&&delete L.transform}S&&Se!==void 0&&j!==void 0&&(te.setKeyframes($),S=getComputedStyle(te.target,te.pseudoElement),S.width!==Se||S.height!==j)&&(S=$[0],S.width=Se,S.height=j,S=$[$.length-1],S.width=Se,S.height=j,te.setKeyframes($))}}r()},function(_){E.__reactViewTransition===w&&(E.__reactViewTransition=null);try{if(typeof _=="object"&&_!==null)switch(_.name){case"InvalidStateError":(_.message==="View transition was skipped because document visibility state is hidden."||_.message==="Skipping view transition because document visibility state has become hidden."||_.message==="Skipping view transition because viewport size changed."||_.message==="Transition was aborted because of invalid state")&&(_=null)}_!==null&&x(_)}finally{a(),n(),r()}}),w.finished.finally(function(){for(var _=0;_<H.length;_++)H[_].cancel();E.__reactViewTransition===w&&(E.__reactViewTransition=null),f()}),w}catch{return a(),n(),r(),null}}function Wa(e,t){this._scope=document.documentElement,this._selector="::view-transition-"+e+"("+t+")"}Wa.prototype.animate=function(e,t){return t=typeof t=="number"?{duration:t}:I({},t),t.pseudoElement=this._selector,this._scope.animate(e,t)},Wa.prototype.getAnimations=function(){for(var e=this._scope,t=this._selector,l=e.getAnimations({subtree:!0}),a=[],n=0;n<l.length;n++){var i=l[n].effect;i!==null&&i.target===e&&i.pseudoElement===t&&a.push(l[n])}return a},Wa.prototype.getComputedStyle=function(){return getComputedStyle(this._scope,this._selector)};function vh(e){return{name:e,group:new Wa("group",e),imagePair:new Wa("image-pair",e),old:new Wa("old",e),new:new Wa("new",e)}}function Jt(e){this._fragmentFiber=e,this._observers=this._eventListeners=null}Jt.prototype.addEventListener=function(e,t,l){var a=null,n=null;if(!(l!=null&&typeof l!="boolean"&&(a=l.signal||null,a!==null&&a.aborted))){this._eventListeners===null&&(this._eventListeners=[]);var i=this._eventListeners;if(bh(i,e,t,l)===-1){var r=this,f=t;l!=null&&typeof l!="boolean"&&l.once===!0&&(f=function(x){r.removeEventListener(e,t,l),typeof t=="function"?t.call(this,x):t.handleEvent(x)}),a!==null&&(n=r.removeEventListener.bind(r,e,t,l),a.addEventListener("abort",n,{once:!0}),n=a.removeEventListener.bind(a,"abort",n)),a=kn(l),i.push({type:e,listener:t,optionsOrUseCapture:l,attachedListener:f,cleanup:n}),g(this._fragmentFiber.child,!1,Kx,e,f,a)}this._eventListeners=i}};function Kx(e,t,l,a){return q(e).addEventListener(t,l,a),!1}Jt.prototype.removeEventListener=function(e,t,l){var a=this._eventListeners;if(a!==null&&(t=bh(a,e,t,l),t!==-1)){var n=a[t];l=n.attachedListener;var i=n.cleanup;n=kn(n.optionsOrUseCapture),g(this._fragmentFiber.child,!1,Jx,e,l,n),a.splice(t,1),i!==null&&i()}};function Jx(e,t,l,a){return q(e).removeEventListener(t,l,a),!1}function kn(e){return e!=null&&typeof e!="boolean"&&(e.once===!0||e.signal instanceof AbortSignal)?{capture:e.capture,passive:e.passive}:e}function yh(e){return e==null?"c=0":typeof e=="boolean"?"c="+(e?"1":"0"):"c="+(e.capture?"1":"0")}function bh(e,t,l,a){if(e.length===0)return-1;a=yh(a);for(var n=0;n<e.length;n++){var i=e[n];if(i.type===t&&i.listener===l&&yh(i.optionsOrUseCapture)===a)return n}return-1}Jt.prototype.dispatchEvent=function(e){var t=A(this._fragmentFiber);if(t===null)return!0;t=q(t);var l=this._eventListeners;if(l!==null&&0<l.length||!e.bubbles){var a=t.nodeType===9?t.createComment(""):document.createTextNode("");if(l)for(var n=0;n<l.length;n++){var i=l[n];a.addEventListener(i.type,i.attachedListener,kn(i.optionsOrUseCapture))}if(t.appendChild(a),e=a.dispatchEvent(e),l)for(n=0;n<l.length;n++)i=l[n],a.removeEventListener(i.type,i.attachedListener,kn(i.optionsOrUseCapture));return t.removeChild(a),e}return t.dispatchEvent(e)},Jt.prototype.focus=function(e){g(this._fragmentFiber.child,!0,Sh,e,void 0,void 0)};function Sh(e,t){return e.tag===6?!1:(e=q(e),uv(e,t))}Jt.prototype.focusLast=function(e){var t=[];g(this._fragmentFiber.child,!0,Zc,t,void 0,void 0);for(var l=t.length-1;0<=l&&!Sh(t[l],e);l--);};function Zc(e,t){return t.push(e),!1}Jt.prototype.blur=function(){var e=A(this._fragmentFiber);e!==null&&(e=q(e),e=Gi(e).activeElement,e!==null&&g(this._fragmentFiber.child,!1,$x,e,void 0,void 0))};function $x(e,t){return e.tag===6?!1:(e=q(e),e===t||e.contains(t)?(t.blur(),!0):!1)}Jt.prototype.observeUsing=function(e){this._observers===null&&(this._observers=new Set),this._observers.add(e),g(this._fragmentFiber.child,!1,Fx,e,void 0,void 0)};function Fx(e,t){return e.tag===6||(e=q(e),t.observe(e)),!1}Jt.prototype.unobserveUsing=function(e){var t=this._observers;if(t!==null&&t.has(e)){t.delete(e),g(this._fragmentFiber.child,!1,Ix,e,void 0,void 0);for(var l=t=0;l<gl.length;l++){var a=gl[l];a.fragmentInstance===this&&a.observer===e?e.unobserve(a.instance):gl[t++]=a}gl.length=t}};function Ix(e,t){return e.tag===6||(e=q(e),t.unobserve(e)),!1}var gl=[],Kc=!1;function Wx(e,t,l){gl.push({fragmentInstance:e,observer:t,instance:l}),Kc||(Kc=!0,sv(function(){Kc=!1;var a=gl;gl=[];for(var n=0;n<a.length;n++){var i=a[n];i.observer.unobserve(i.instance)}}))}Jt.prototype.getClientRects=function(){var e=[];return g(this._fragmentFiber.child,!1,Px,e,void 0,void 0),e};function Px(e,t){if(e.tag===6){e=e.stateNode;var l=e.ownerDocument.createRange();l.selectNodeContents(e),t.push.apply(t,l.getClientRects())}else e=q(e),t.push.apply(t,e.getClientRects());return!1}Jt.prototype.getRootNode=function(e){var t=A(this._fragmentFiber);return t===null?this:q(t).getRootNode(e)},Jt.prototype.compareDocumentPosition=function(e){var t=A(this._fragmentFiber);if(t===null)return Node.DOCUMENT_POSITION_DISCONNECTED;var l=[];g(this._fragmentFiber.child,!1,Zc,l,void 0,void 0);var a=q(t);if(l.length===0){if(l=a,B(this._fragmentFiber)){e:{for(t=this._fragmentFiber.return;t!==null;){if(t.tag===4){t=t.stateNode.containerInfo;break e}if(t.tag===3||t.tag===5||t.tag===27)break;t=t.return}t=null}t!=null&&(l=t)}t=this._fragmentFiber;var n=a=l.compareDocumentPosition(e);return l===e?n=Node.DOCUMENT_POSITION_CONTAINS:a&Node.DOCUMENT_POSITION_CONTAINED_BY&&(l=U(t)[1],l===null?n=Node.DOCUMENT_POSITION_PRECEDING:(e=q(l).compareDocumentPosition(e),n=e===0||e&Node.DOCUMENT_POSITION_FOLLOWING?Node.DOCUMENT_POSITION_FOLLOWING:Node.DOCUMENT_POSITION_PRECEDING)),n|=Node.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC}t=q(l[0]),n=q(l[l.length-1]);var i=B(this._fragmentFiber)?t.parentElement:a;if(i==null)return Node.DOCUMENT_POSITION_DISCONNECTED;a=i.compareDocumentPosition(t)&Node.DOCUMENT_POSITION_CONTAINED_BY,i=i.compareDocumentPosition(n)&Node.DOCUMENT_POSITION_CONTAINED_BY;var r=t.compareDocumentPosition(e),f=n.compareDocumentPosition(e),x=r&Node.DOCUMENT_POSITION_CONTAINED_BY||f&Node.DOCUMENT_POSITION_CONTAINED_BY;return f=a&&i&&r&Node.DOCUMENT_POSITION_FOLLOWING&&f&Node.DOCUMENT_POSITION_PRECEDING,t=a&&t===e||i&&n===e||x||f?Node.DOCUMENT_POSITION_CONTAINED_BY:!a&&t===e||!i&&n===e?Node.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC:r,t&Node.DOCUMENT_POSITION_DISCONNECTED||t&Node.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC||ev(t,this._fragmentFiber,l[0],l[l.length-1],e)?t:Node.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC};function ev(e,t,l,a,n){var i=Oa(n);if(e&Node.DOCUMENT_POSITION_CONTAINED_BY){if(l=!!i)e:{for(;i!==null;){if(i.tag===7&&(i===t||i.alternate===t)){l=!0;break e}i=i.return}l=!1}return l}if(e&Node.DOCUMENT_POSITION_CONTAINS){if(i===null)return i=n.ownerDocument,n===i||n===i.documentElement||n===i.body;e:{for(i=t,t=A(t);i!==null;){if(!(i.tag!==5&&i.tag!==3&&i.tag!==27||i!==t&&i.alternate!==t)){i=!0;break e}i=i.return}i=!1}return i}return e&Node.DOCUMENT_POSITION_PRECEDING?((t=!!i)&&!(t=i===l)&&(t=xe(l,i,J),t===null?t=!1:(g(t,!0,le,i,l),i=Y,Y=null,t=i!==null)),t):e&Node.DOCUMENT_POSITION_FOLLOWING?((t=!!i)&&!(t=i===a)&&(t=xe(a,i,J),t===null?t=!1:(g(t,!0,F,i,a),i=Y,ee=Y=null,t=i!==null)),t):!1}function Nh(e,t){var l=e.ownerDocument.createRange();l.selectNodeContents(e),e=l.getBoundingClientRect(),window.scrollTo(window.scrollX+e.left,t?window.scrollY+e.top:window.scrollY+e.bottom-window.innerHeight)}Jt.prototype.scrollIntoView=function(e){if(typeof e=="object")throw Error(c(566));var t=[];g(this._fragmentFiber.child,!1,Zc,t,void 0,void 0);var l=e!==!1;if(t.length===0){var a=U(this._fragmentFiber);if(a=l?a[1]||a[0]||A(this._fragmentFiber):a[0]||a[1],a===null)return;if(a.tag===6){e=q(a),Nh(e,l);return}if(a=q(a),a.nodeType!==9){if(a.nodeType===11){l="host"in a?a.host:null,l!==null&&l.scrollIntoView(e);return}a.scrollIntoView(e)}}for(a=l?t.length-1:0;a!==(l?-1:t.length);){var n=t[a];n.tag===6?(n=q(n),Nh(n,l)):q(n).scrollIntoView(e),a+=l?-1:1}};function tv(e,t){return e=q(e),_h(e,t),!1}function _h(e,t){e.reactFragments==null&&(e.reactFragments=new Set),e.reactFragments.add(t)}function jh(e,t){var l=t._eventListeners;if(l!==null)for(var a=0;a<l.length;a++){var n=l[a];e.addEventListener(n.type,n.attachedListener,kn(n.optionsOrUseCapture))}e.nodeType!==3&&(l=t._observers,l!==null&&l.forEach(function(i){for(var r=0,f=0;f<gl.length;f++){var x=gl[f];(x.fragmentInstance!==t||x.observer!==i||x.instance!==e)&&(gl[r++]=x)}gl.length=r,i.observe(e)}),_h(e,t))}function lv(e,t){var l=t._eventListeners;if(l!==null)for(var a=0;a<l.length;a++){var n=l[a];e.removeEventListener(n.type,n.attachedListener,kn(n.optionsOrUseCapture))}e.nodeType!==3&&(l=t._observers,l!==null&&l.forEach(function(i){typeof i.rootMargin=="string"?Wx(t,i,e):i.unobserve(e)}),e.reactFragments!=null&&e.reactFragments.delete(t))}function Jc(e){var t=e.firstChild;for(t&&t.nodeType===10&&(t=t.nextSibling);t;){var l=t;switch(t=t.nextSibling,l.nodeName){case"HTML":case"HEAD":case"BODY":Jc(l),nu(l);continue;case"SCRIPT":case"STYLE":continue;case"LINK":if(l.rel.toLowerCase()==="stylesheet")continue}e.removeChild(l)}}function av(e,t,l,a){for(;e.nodeType===1;){var n=l;if(e.nodeName.toLowerCase()!==t.toLowerCase()){if(!a&&(e.nodeName!=="INPUT"||e.type!=="hidden"))break}else if(a){if(!e[ii])switch(t){case"meta":if(!e.hasAttribute("itemprop"))break;return e;case"link":if(i=e.getAttribute("rel"),i==="stylesheet"&&e.hasAttribute("data-precedence"))break;if(i!==n.rel||e.getAttribute("href")!==(n.href==null||n.href===""?null:n.href)||e.getAttribute("crossorigin")!==(n.crossOrigin==null?null:n.crossOrigin)||e.getAttribute("title")!==(n.title==null?null:n.title))break;return e;case"style":if(e.hasAttribute("data-precedence"))break;return e;case"script":if(i=e.getAttribute("src"),(i!==(n.src==null?null:n.src)||e.getAttribute("type")!==(n.type==null?null:n.type)||e.getAttribute("crossorigin")!==(n.crossOrigin==null?null:n.crossOrigin))&&i&&e.hasAttribute("async")&&!e.hasAttribute("itemprop"))break;return e;default:return e}}else if(t==="input"&&e.type==="hidden"){var i=n.name==null?null:""+n.name;if(n.type==="hidden"&&e.getAttribute("name")===i)return e}else return e;if(e=ul(e.nextSibling),e===null)break}return null}function nv(e,t,l){if(t==="")return null;for(;e.nodeType!==3;)if((e.nodeType!==1||e.nodeName!=="INPUT"||e.type!=="hidden")&&!l||(e=ul(e.nextSibling),e===null))return null;return e}function Eh(e,t){for(;e.nodeType!==8;)if((e.nodeType!==1||e.nodeName!=="INPUT"||e.type!=="hidden")&&!t||(e=ul(e.nextSibling),e===null))return null;return e}function $c(e){return e.data==="$?"||e.data==="$~"}function Fc(e){return e.data==="$!"||e.data==="$?"&&e.ownerDocument.readyState!=="loading"}function iv(e,t){var l=e.ownerDocument;if(e.data==="$~")e._reactRetry=t;else if(e.data!=="$?"||l.readyState!=="loading")t();else{var a=function(){t(),l.removeEventListener("DOMContentLoaded",a)};l.addEventListener("DOMContentLoaded",a),e._reactRetry=a}}function ul(e){for(;e!=null;e=e.nextSibling){var t=e.nodeType;if(t===1||t===3)break;if(t===8){if(t=e.data,t==="$"||t==="$!"||t==="$?"||t==="$~"||t==="&"||t==="F!"||t==="F")break;if(t==="/$"||t==="/&")return null}}return e}var Ic=null;function Th(e){e=e.nextSibling;for(var t=0;e;){if(e.nodeType===8){var l=e.data;if(l==="/$"||l==="/&"){if(t===0)return ul(e.nextSibling);t--}else l!=="$"&&l!=="$!"&&l!=="$?"&&l!=="$~"&&l!=="&"||t++}e=e.nextSibling}return null}function Ch(e){e=e.previousSibling;for(var t=0;e;){if(e.nodeType===8){var l=e.data;if(l==="$"||l==="$!"||l==="$?"||l==="$~"||l==="&"){if(t===0)return e;t--}else l!=="/$"&&l!=="/&"||t++}e=e.previousSibling}return null}function uv(e,t){function l(){a=!0}if(e.ownerDocument.activeElement===e)return!0;var a=!1;try{e.ownerDocument.addEventListener("focus",l,!0),(e.focus||HTMLElement.prototype.focus).call(e,t)}finally{e.ownerDocument.removeEventListener("focus",l,!0)}return a}function sv(e){mh(function(){mh(function(t){return e(t)})})}function zh(e,t,l){switch(t=Gi(l),e){case"html":if(e=t.documentElement,!e)throw Error(c(452));return e;case"head":if(e=t.head,!e)throw Error(c(453));return e;case"body":if(e=t.body,!e)throw Error(c(454));return e;default:throw Error(c(451))}}function Ah(e,t,l){for(var a in l){var n=l[a];l.hasOwnProperty(a)&&n!=null&&Qe(e,t,a,null,Lx,n)}l.dangerouslySetInnerHTML!=null&&(e.textContent=""),e.onclick===yl&&(e.onclick=null),nu(e)}function Wc(e){for(var t=e.attributes;t.length;)e.removeAttributeNode(t[0]);nu(e)}var sl=new Map,Rh=new Set;function ki(e){if(typeof e.getRootNode=="function"){var t=e.getRootNode();if(t.nodeType===9||t.nodeType===11)return t}return e.nodeType===9?e:e.ownerDocument}var Jl=ne.d;ne.d={f:rv,r:cv,D:ov,C:fv,L:dv,m:mv,X:pv,S:hv,M:gv};function rv(){var e=Jl.f(),t=ss();return e||t}function cv(e){var t=sn(e);t!==null&&t.tag===5&&t.type==="form"?wd(t):Jl.r(e)}var Qn=typeof document>"u"?null:document;function Oh(e,t,l){var a=Qn;if(a&&typeof t=="string"&&t){var n=Pt(t);n='link[rel="'+e+'"][href="'+n+'"]',typeof l=="string"&&(n+='[crossorigin="'+l+'"]'),Rh.has(n)||(Rh.add(n),e={rel:e,crossOrigin:l,href:t},a.querySelector(n)===null&&(t=a.createElement("link"),Nt(t,"link",e),dt(t),a.head.appendChild(t)))}}function ov(e){Jl.D(e),Oh("dns-prefetch",e,null)}function fv(e,t){Jl.C(e,t),Oh("preconnect",e,t)}function dv(e,t,l){Jl.L(e,t,l);var a=Qn;if(a&&e&&t){var n='link[rel="preload"][as="'+Pt(t)+'"]';t==="image"&&l&&l.imageSrcSet?(n+='[imagesrcset="'+Pt(l.imageSrcSet)+'"]',typeof l.imageSizes=="string"&&(n+='[imagesizes="'+Pt(l.imageSizes)+'"]')):n+='[href="'+Pt(e)+'"]';var i=n;switch(t){case"style":i=Xn(e);break;case"script":i=Vn(e)}if(!(sl.has(i)||(e=I({rel:"preload",href:t==="image"&&l&&l.imageSrcSet?void 0:e,as:t},l),sl.set(i,e),a.querySelector(n)!==null||t==="style"&&a.querySelector(Qi(i))||t==="script"&&a.querySelector(Xi(i))))){var r=a.createElement("link");Nt(r,"link",e),t==="style"&&(r[au]=!0,r.onload=r.onerror=function(){Qo(r)}),dt(r),a.head.appendChild(r)}}}function mv(e,t){Jl.m(e,t);var l=Qn;if(l&&e){var a=t&&typeof t.as=="string"?t.as:"script",n='link[rel="modulepreload"][as="'+Pt(a)+'"][href="'+Pt(e)+'"]',i=n;switch(a){case"audioworklet":case"paintworklet":case"serviceworker":case"sharedworker":case"worker":case"script":i=Vn(e)}if(!sl.has(i)&&(e=I({rel:"modulepreload",href:e},t),sl.set(i,e),l.querySelector(n)===null)){switch(a){case"audioworklet":case"paintworklet":case"serviceworker":case"sharedworker":case"worker":case"script":if(l.querySelector(Xi(i)))return}a=l.createElement("link"),Nt(a,"link",e),dt(a),l.head.appendChild(a)}}}function hv(e,t,l){Jl.S(e,t,l);var a=Qn;if(a&&e){var n=rn(a).hoistableStyles,i=Xn(e);t=t||"default";var r=n.get(i);if(!r){var f={loading:0,preload:null};if(r=a.querySelector(Qi(i)))f.loading=5;else{e=I({rel:"stylesheet",href:e,"data-precedence":t},l),(l=sl.get(i))&&Pc(e,l);var x=r=a.createElement("link");dt(x),Nt(x,"link",e),x._p=new Promise(function(E,w){x.onload=E,x.onerror=w}),x.addEventListener("load",function(){f.loading|=1}),x.addEventListener("error",function(){f.loading|=2}),f.loading|=4,hs(r,t,a)}r={type:"stylesheet",instance:r,count:1,state:f},n.set(i,r)}}}function pv(e,t){Jl.X(e,t);var l=Qn;if(l&&e){var a=rn(l).hoistableScripts,n=Vn(e),i=a.get(n);i||(i=l.querySelector(Xi(n)),i||(e=I({src:e,async:!0},t),(t=sl.get(n))&&eo(e,t),i=l.createElement("script"),dt(i),Nt(i,"link",e),l.head.appendChild(i)),i={type:"script",instance:i,count:1,state:null},a.set(n,i))}}function gv(e,t){Jl.M(e,t);var l=Qn;if(l&&e){var a=rn(l).hoistableScripts,n=Vn(e),i=a.get(n);i||(i=l.querySelector(Xi(n)),i||(e=I({src:e,async:!0,type:"module"},t),(t=sl.get(n))&&eo(e,t),i=l.createElement("script"),dt(i),Nt(i,"link",e),l.head.appendChild(i)),i={type:"script",instance:i,count:1,state:null},a.set(n,i))}}function wh(e,t,l,a){var n=(n=It.current)?ki(n):null;if(!n)throw Error(c(446));switch(e){case"meta":case"title":return null;case"style":return typeof l.precedence=="string"&&typeof l.href=="string"?(l=Xn(l.href),t=rn(n).hoistableStyles,a=t.get(l),a||(a={type:"style",instance:null,count:0,state:null},t.set(l,a)),a):{type:"void",instance:null,count:0,state:null};case"link":if(l.rel==="stylesheet"&&typeof l.href=="string"&&typeof l.precedence=="string"){e=Xn(l.href);var i=rn(n).hoistableStyles,r=i.get(e);if(r||(n=n.ownerDocument||n,r={type:"stylesheet",instance:null,count:0,state:{loading:0,preload:null}},i.set(e,r),(i=n.querySelector(Qi(e)))?i._p||(r.instance=i,r.state.loading=5):(i=sl.get(e),i||(i={rel:"preload",as:"style",href:l.href,crossOrigin:l.crossOrigin,integrity:l.integrity,media:l.media,hrefLang:l.hrefLang,referrerPolicy:l.referrerPolicy},sl.set(e,i)),xv(n,e,i,r.state))),t&&a===null)throw Error(c(528,""));return r}if(t&&a!==null)throw Error(c(529,""));return null;case"script":return t=l.async,l=l.src,typeof l=="string"&&t&&typeof t!="function"&&typeof t!="symbol"?(l=Vn(l),t=rn(n).hoistableScripts,a=t.get(l),a||(a={type:"script",instance:null,count:0,state:null},t.set(l,a)),a):{type:"void",instance:null,count:0,state:null};default:throw Error(c(444,e))}}function Xn(e){return'href="'+Pt(e)+'"'}function Qi(e){return'link[rel="stylesheet"]['+e+"]"}function Mh(e){return I({},e,{"data-precedence":e.precedence,precedence:null})}function xv(e,t,l,a){if(t=e.querySelector('link[rel="preload"][as="style"]['+t+"]")){if(t[au]!==!0){a.loading=1;return}}else t=e.createElement("link"),t[au]=!0,t.onload=t.onerror=Qo.bind(null,t),Nt(t,"link",l),dt(t),e.head.appendChild(t);a.preload=t,t.addEventListener("load",function(){return a.loading|=1}),t.addEventListener("error",function(){return a.loading|=2})}function Vn(e){return'[src="'+Pt(e)+'"]'}function Xi(e){return"script[async]"+e}function Dh(e,t,l){if(t.count++,t.instance===null)switch(t.type){case"style":var a=e.querySelector('style[data-href~="'+Pt(l.href)+'"]');if(a)return t.instance=a,dt(a),a;var n=I({},l,{"data-href":l.href,"data-precedence":l.precedence,href:null,precedence:null});return a=(e.ownerDocument||e).createElement("style"),dt(a),Nt(a,"style",n),hs(a,l.precedence,e),t.instance=a;case"stylesheet":n=Xn(l.href);var i=e.querySelector(Qi(n));if(i)return t.state.loading|=4,t.instance=i,dt(i),i;a=Mh(l),(n=sl.get(n))&&Pc(a,n),i=(e.ownerDocument||e).createElement("link"),dt(i);var r=i;return r._p=new Promise(function(f,x){r.onload=f,r.onerror=x}),Nt(i,"link",a),t.state.loading|=4,hs(i,l.precedence,e),t.instance=i;case"script":return i=Vn(l.src),(n=e.querySelector(Xi(i)))?(t.instance=n,dt(n),n):(a=l,(n=sl.get(i))&&(a=I({},l),eo(a,n)),e=e.ownerDocument||e,n=e.createElement("script"),dt(n),Nt(n,"link",a),e.head.appendChild(n),t.instance=n);case"void":return null;default:throw Error(c(443,t.type))}else t.type==="stylesheet"&&!(t.state.loading&4)&&(a=t.instance,t.state.loading|=4,hs(a,l.precedence,e));return t.instance}function hs(e,t,l){for(var a=l.querySelectorAll('link[rel="stylesheet"][data-precedence],style[data-precedence]'),n=a.length?a[a.length-1]:null,i=n,r=0;r<a.length;r++){var f=a[r];if(f.dataset.precedence===t)i=f;else if(i!==n)break}i?i.parentNode.insertBefore(e,i.nextSibling):(t=l.nodeType===9?l.head:l,t.insertBefore(e,t.firstChild))}function Pc(e,t){e.crossOrigin==null&&(e.crossOrigin=t.crossOrigin),e.referrerPolicy==null&&(e.referrerPolicy=t.referrerPolicy),e.title==null&&(e.title=t.title)}function eo(e,t){e.crossOrigin==null&&(e.crossOrigin=t.crossOrigin),e.referrerPolicy==null&&(e.referrerPolicy=t.referrerPolicy),e.integrity==null&&(e.integrity=t.integrity)}var ps=null;function Uh(e,t,l){if(ps===null){var a=new Map,n=ps=new Map;n.set(l,a)}else n=ps,a=n.get(l),a||(a=new Map,n.set(l,a));if(a.has(e))return a;for(a.set(e,null),l=l.getElementsByTagName(e),n=0;n<l.length;n++){var i=l[n];if(!(i[ii]||i[xt]||e==="link"&&i.getAttribute("rel")==="stylesheet")&&i.namespaceURI!=="http://www.w3.org/2000/svg"){var r=i.getAttribute(t)||"";r=e+r;var f=a.get(r);f?f.push(i):a.set(r,[i])}}return a}function to(e,t,l){e=e.ownerDocument||e,e.head.insertBefore(l,t==="title"?e.querySelector("head > title"):null)}function vv(e,t,l){if(l===1||t.itemProp!=null)return!1;switch(e){case"meta":case"title":return!0;case"style":if(typeof t.precedence!="string"||typeof t.href!="string"||t.href==="")break;return!0;case"link":if(typeof t.rel!="string"||typeof t.href!="string"||t.href===""||t.onLoad||t.onError)break;switch(t.rel){case"stylesheet":return e=t.disabled,typeof t.precedence=="string"&&e==null;default:return!0}case"script":if(t.async&&typeof t.async!="function"&&typeof t.async!="symbol"&&!t.onLoad&&!t.onError&&t.src&&typeof t.src=="string")return!0}return!1}function Lh(e,t){return e==="img"&&t.src!=null&&t.src!==""&&t.onLoad==null&&t.loading!=="lazy"}function Hh(e){return!(e.type==="stylesheet"&&!(e.state.loading&3))}function Bh(e){return(e.width||100)*(e.height||100)*(typeof devicePixelRatio=="number"?devicePixelRatio:1)*.25}function qh(e,t){typeof t.decode=="function"&&(e.imgCount++,t.complete||(e.imgBytes+=Bh(t),e.suspenseyImages.push(t)),e=Sv.bind(e),t.decode().then(e,e))}function yv(e,t,l,a){if(l.type==="stylesheet"&&(typeof a.media!="string"||matchMedia(a.media).matches!==!1)&&!(l.state.loading&4)){if(l.instance===null){var n=Xn(a.href),i=t.querySelector(Qi(n));if(i){t=i._p,t!==null&&typeof t=="object"&&typeof t.then=="function"&&(e.count++,e=Vi.bind(e),t.then(e,e)),l.state.loading|=4,l.instance=i,dt(i);return}i=t.ownerDocument||t,a=Mh(a),(n=sl.get(n))&&Pc(a,n),i=i.createElement("link"),dt(i);var r=i;r._p=new Promise(function(f,x){r.onload=f,r.onerror=x}),Nt(i,"link",a),l.instance=i}e.stylesheets===null&&(e.stylesheets=new Map),e.stylesheets.set(l,t),(t=l.state.preload)&&!(l.state.loading&3)&&(e.count++,l=Vi.bind(e),t.addEventListener("load",l),t.addEventListener("error",l))}}var gs=0;function bv(e,t){return e.stylesheets&&e.count===0&&vs(e,e.stylesheets),0<e.count||0<e.imgCount?function(l){var a=setTimeout(function(){if(e.stylesheets&&vs(e,e.stylesheets),e.unsuspend){var i=e.unsuspend;e.unsuspend=null,i()}},6e4+t);0<e.imgBytes&&gs===0&&(gs=62500*Bx());var n=setTimeout(function(){if(e.waitingForImages=!1,e.count===0&&(e.stylesheets&&vs(e,e.stylesheets),e.unsuspend)){var i=e.unsuspend;e.unsuspend=null,i()}},(e.imgBytes>gs?50:800)+t);return e.unsuspend=l,function(){e.unsuspend=null,clearTimeout(a),clearTimeout(n)}}:null}function Yh(e){if(e.count===0&&(e.imgCount===0||!e.waitingForImages)){if(e.stylesheets)vs(e,e.stylesheets);else if(e.unsuspend){var t=e.unsuspend;e.unsuspend=null,t()}}}function Vi(){this.count--,Yh(this)}function Sv(){this.imgCount--,Yh(this)}var xs=null;function vs(e,t){e.stylesheets=null,e.unsuspend!==null&&(e.count++,xs=new Map,t.forEach(Nv,e),xs=null,Vi.call(e))}function Nv(e,t){if(!(t.state.loading&4)){var l=xs.get(e);if(l)var a=l.get(null);else{l=new Map,xs.set(e,l);for(var n=e.querySelectorAll("link[data-precedence],style[data-precedence]"),i=0;i<n.length;i++){var r=n[i];(r.nodeName==="LINK"||r.getAttribute("media")!=="not all")&&(l.set(r.dataset.precedence,r),a=r)}a&&l.set(null,a)}n=t.instance,r=n.getAttribute("data-precedence"),i=l.get(r)||a,i===a&&l.set(null,n),l.set(r,n),this.count++,a=Vi.bind(this),n.addEventListener("load",a),n.addEventListener("error",a),i?i.parentNode.insertBefore(n,i.nextSibling):(e=e.nodeType===9?e.head:e,e.insertBefore(n,e.firstChild)),t.state.loading|=4}}var Zn={$$typeof:je,Provider:null,Consumer:null,_currentValue:Me,_currentValue2:Me,_threadCount:0};function _v(e,t,l,a,n,i,r,f,x){this.tag=1,this.containerInfo=e,this.pingCache=this.current=this.pendingChildren=null,this.timeoutHandle=-1,this.callbackNode=this.next=this.pendingContext=this.context=this.cancelPendingCommit=null,this.callbackPriority=0,this.expirationTimes=Us(-1),this.entangledLanes=this.shellSuspendCounter=this.errorRecoveryDisabledLanes=this.expiredLanes=this.warmLanes=this.pingedLanes=this.suspendedLanes=this.pendingLanes=0,this.entanglements=Us(0),this.hiddenUpdates=Us(null),this.identifierPrefix=a,this.onUncaughtError=n,this.onCaughtError=i,this.onRecoverableError=r,this.pooledCache=null,this.pooledCacheLanes=0,this.formState=x,this.transitionTypes=null,this.incompleteTransitions=new Map}function Gh(e,t,l,a,n,i,r,f,x,E,w,H){return e=new _v(e,t,l,r,x,E,w,H,f),t=1,i===!0&&(t|=24),i=Dt(3,null,null,t),e.current=i,i.stateNode=e,t=gr(),t.refCount++,e.pooledCache=t,t.refCount++,i.memoizedState={element:a,isDehydrated:l,cache:t},br(i),e}function kh(e){return e?(e=vn,e):vn}function Qh(e,t,l,a,n,i){n=kh(n),a.context===null?a.context=n:a.pendingContext=n,a=ua(t),a.payload={element:l},i=i===void 0?null:i,i!==null&&(a.callback=i),l=sa(e,a,t),l!==null&&(Bt(l,e,t),Ni(l,e,t))}function Xh(e,t){if(e=e.memoizedState,e!==null&&e.dehydrated!==null){var l=e.retryLane;e.retryLane=l!==0&&l<t?l:t}}function lo(e,t){Xh(e,t),(e=e.alternate)&&Xh(e,t)}function Vh(e){if(e.tag===13||e.tag===31){var t=Ua(e,67108864);t!==null&&Bt(t,e,67108864),lo(e,67108864)}}function Zh(e){if(e.tag===13||e.tag===31){var t=Kt();t=Ls(t);var l=Ua(e,t);l!==null&&Bt(l,e,t),lo(e,t)}}var Kn=!0;function jv(e,t,l,a){var n=ae.T;ae.T=null;var i=ne.p;try{ne.p=2,ao(e,t,l,a)}finally{ne.p=i,ae.T=n}}function Ev(e,t,l,a){var n=ae.T;ae.T=null;var i=ne.p;try{ne.p=8,ao(e,t,l,a)}finally{ne.p=i,ae.T=n}}function ao(e,t,l,a){if(Kn){var n=no(a);if(n===null)Bc(e,t,a,ys,l),Jh(e,a);else if(Cv(n,e,t,l,a))a.stopPropagation();else if(Jh(e,a),t&4&&-1<Tv.indexOf(e)){for(;n!==null;){var i=sn(n);if(i!==null)switch(i.tag){case 3:if(i=i.stateNode,i.current.memoizedState.isDehydrated){var r=Ra(i.pendingLanes);if(r!==0){var f=i;for(f.pendingLanes|=2,f.entangledLanes|=2;r;){var x=1<<31-it(r);f.entanglements[1]|=x,r&=~x}Al(i),!(qe&6)&&(ns=M()+500,Bi(0))}}break;case 31:case 13:f=Ua(i,2),f!==null&&Bt(f,i,2),ss(),lo(i,2)}if(i=no(a),i===null&&Bc(e,t,a,ys,l),i===n)break;n=i}n!==null&&a.stopPropagation()}else Bc(e,t,a,null,l)}}function no(e){return e=Qs(e),io(e)}var ys=null;function io(e){if(ys=null,e=Oa(e),e!==null){var t=p(e);if(t===null)e=null;else{var l=t.tag;if(l===13){if(e=v(t),e!==null)return e;e=null}else if(l===31){if(e=T(t),e!==null)return e;e=null}else if(l===3){if(t.stateNode.current.memoizedState.isDehydrated)return t.tag===3?t.stateNode.containerInfo:null;e=null}else t!==e&&(e=null)}}return ys=e,null}function Kh(e){switch(e){case"beforetoggle":case"cancel":case"click":case"close":case"contextmenu":case"copy":case"cut":case"auxclick":case"dblclick":case"dragend":case"dragstart":case"drop":case"focusin":case"focusout":case"input":case"invalid":case"keydown":case"keypress":case"keyup":case"mousedown":case"mouseup":case"paste":case"pause":case"play":case"pointercancel":case"pointerdown":case"pointerup":case"ratechange":case"reset":case"seeked":case"submit":case"toggle":case"touchcancel":case"touchend":case"touchstart":case"volumechange":case"change":case"selectionchange":case"textInput":case"compositionstart":case"compositionend":case"compositionupdate":case"beforeblur":case"afterblur":case"beforeinput":case"blur":case"fullscreenchange":case"fullscreenerror":case"focus":case"hashchange":case"popstate":case"select":case"selectstart":return 2;case"drag":case"dragenter":case"dragexit":case"dragleave":case"dragover":case"mousemove":case"mouseout":case"mouseover":case"pointermove":case"pointerout":case"pointerover":case"resize":case"scroll":case"touchmove":case"wheel":case"mouseenter":case"mouseleave":case"pointerenter":case"pointerleave":return 8;case"message":switch(P()){case X:return 2;case ve:return 8;case Ue:case ye:return 32;case he:return 268435456;default:return 32}default:return 32}}var uo=!1,ya=null,ba=null,Sa=null,Zi=new Map,Ki=new Map,Na=[],Tv="mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput copy cut paste click change contextmenu reset".split(" ");function Jh(e,t){switch(e){case"focusin":case"focusout":ya=null;break;case"dragenter":case"dragleave":ba=null;break;case"mouseover":case"mouseout":Sa=null;break;case"pointerover":case"pointerout":Zi.delete(t.pointerId);break;case"gotpointercapture":case"lostpointercapture":Ki.delete(t.pointerId)}}function Ji(e,t,l,a,n,i){return e===null||e.nativeEvent!==i?(e={blockedOn:t,domEventName:l,eventSystemFlags:a,nativeEvent:i,targetContainers:[n]},t!==null&&(t=sn(t),t!==null&&Vh(t)),e):(e.eventSystemFlags|=a,t=e.targetContainers,n!==null&&t.indexOf(n)===-1&&t.push(n),e)}function Cv(e,t,l,a,n){switch(t){case"focusin":return ya=Ji(ya,e,t,l,a,n),!0;case"dragenter":return ba=Ji(ba,e,t,l,a,n),!0;case"mouseover":return Sa=Ji(Sa,e,t,l,a,n),!0;case"pointerover":var i=n.pointerId;return Zi.set(i,Ji(Zi.get(i)||null,e,t,l,a,n)),!0;case"gotpointercapture":return i=n.pointerId,Ki.set(i,Ji(Ki.get(i)||null,e,t,l,a,n)),!0}return!1}function $h(e){var t=Oa(e.target);if(t!==null){var l=p(t);if(l!==null){if(t=l.tag,t===13){if(t=v(l),t!==null){e.blockedOn=t,Yo(e.priority,function(){Zh(l)});return}}else if(t===31){if(t=T(l),t!==null){e.blockedOn=t,Yo(e.priority,function(){Zh(l)});return}}else if(t===3&&l.stateNode.current.memoizedState.isDehydrated){e.blockedOn=l.tag===3?l.stateNode.containerInfo:null;return}}}e.blockedOn=null}function bs(e){if(e.blockedOn!==null)return!1;for(var t=e.targetContainers;0<t.length;){var l=no(e.nativeEvent);if(l===null){l=e.nativeEvent;var a=new l.constructor(l.type,l);ks=a,l.target.dispatchEvent(a),ks=null}else return t=sn(l),t!==null&&Vh(t),e.blockedOn=l,!1;t.shift()}return!0}function Fh(e,t,l){bs(e)&&l.delete(t)}function zv(){uo=!1,ya!==null&&bs(ya)&&(ya=null),ba!==null&&bs(ba)&&(ba=null),Sa!==null&&bs(Sa)&&(Sa=null),Zi.forEach(Fh),Ki.forEach(Fh)}function Ss(e,t){e.blockedOn===t&&(e.blockedOn=null,uo||(uo=!0,s.unstable_scheduleCallback(s.unstable_NormalPriority,zv)))}var Ns=null;function Ih(e){Ns!==e&&(Ns=e,s.unstable_scheduleCallback(s.unstable_NormalPriority,function(){Ns===e&&(Ns=null);for(var t=0;t<e.length;t+=3){var l=e[t],a=e[t+1],n=e[t+2];if(typeof a!="function"){if(io(a||l)===null)continue;break}var i=sn(l);i!==null&&(e.splice(t,3),t-=3,Gr(i,{pending:!0,data:n,method:l.method,action:a},a,n))}}))}function Jn(e){function t(x){return Ss(x,e)}ya!==null&&Ss(ya,e),ba!==null&&Ss(ba,e),Sa!==null&&Ss(Sa,e),Zi.forEach(t),Ki.forEach(t);for(var l=0;l<Na.length;l++){var a=Na[l];a.blockedOn===e&&(a.blockedOn=null)}for(;0<Na.length&&(l=Na[0],l.blockedOn===null);)$h(l),l.blockedOn===null&&Na.shift();if(l=(e.ownerDocument||e).$$reactFormReplay,l!=null)for(a=0;a<l.length;a+=3){var n=l[a],i=l[a+1],r=n[Mt]||null;if(typeof i=="function")r||Ih(l);else if(r){var f=null;if(i&&i.hasAttribute("formAction")){if(n=i,r=i[Mt]||null)f=r.formAction;else if(io(n)!==null)continue}else f=r.action;typeof f=="function"?l[a+1]=f:(l.splice(a,3),a-=3),Ih(l)}}}function Wh(){function e(i){i.canIntercept&&i.info==="react-transition"&&i.intercept({handler:function(){return new Promise(function(r){return n=r})},focusReset:"manual",scroll:"manual"})}function t(){n!==null&&(n(),n=null),a||setTimeout(l,20)}function l(){if(!a&&!navigation.transition){var i=navigation.currentEntry;i&&i.url!=null&&navigation.navigate(i.url,{state:i.getState(),info:"react-transition",history:"replace"})}}if(typeof navigation=="object"){var a=!1,n=null;return navigation.addEventListener("navigate",e),navigation.addEventListener("navigatesuccess",t),navigation.addEventListener("navigateerror",t),setTimeout(l,100),function(){a=!0,navigation.removeEventListener("navigate",e),navigation.removeEventListener("navigatesuccess",t),navigation.removeEventListener("navigateerror",t),n!==null&&(n(),n=null)}}}function so(e){this._internalRoot=e}_s.prototype.render=so.prototype.render=function(e){var t=this._internalRoot;if(t===null)throw Error(c(409));var l=t.current,a=Kt();Qh(l,a,e,t,null,null)},_s.prototype.unmount=so.prototype.unmount=function(){var e=this._internalRoot;if(e!==null){this._internalRoot=null;var t=e.containerInfo;Qh(e.current,2,null,e,null,null),ss(),t[un]=null}};function _s(e){this._internalRoot=e}_s.prototype.unstable_scheduleHydration=function(e){if(e){var t=qo();e={blockedOn:null,target:e,priority:t};for(var l=0;l<Na.length&&t!==0&&t<Na[l].priority;l++);Na.splice(l,0,e),l===0&&$h(e)}};var Ph=o.version;if(Ph!=="19.3.1")throw Error(c(527,Ph,"19.3.1"));ne.findDOMNode=function(e){var t=e._reactInternals;if(t===void 0)throw typeof e.render=="function"?Error(c(188)):(e=Object.keys(e).join(","),Error(c(268,e)));return e=z(t),e=e!==null?y(e):null,e=e===null?null:e.stateNode,e};var Av={bundleType:0,version:"19.3.1",rendererPackageName:"react-dom",currentDispatcherRef:ae,reconcilerVersion:"19.3.1"};if(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__<"u"){var js=__REACT_DEVTOOLS_GLOBAL_HOOK__;if(!js.isDisabled&&js.supportsFiber)try{Et=js.inject(Av),ft=js}catch{}}return Fi.createRoot=function(e,t){if(!d(e))throw Error(c(299));var l=!1,a="",n=kd,i=Qd,r=Xd;return t!=null&&(t.unstable_strictMode===!0&&(l=!0),t.identifierPrefix!==void 0&&(a=t.identifierPrefix),t.onUncaughtError!==void 0&&(n=t.onUncaughtError),t.onCaughtError!==void 0&&(i=t.onCaughtError),t.onRecoverableError!==void 0&&(r=t.onRecoverableError)),t=Gh(e,1,!1,null,null,l,a,null,n,i,r,Wh),e[un]=t.current,Hc(e),new so(t)},Fi.hydrateRoot=function(e,t,l){if(!d(e))throw Error(c(299));var a=!1,n="",i=kd,r=Qd,f=Xd,x=null;return l!=null&&(l.unstable_strictMode===!0&&(a=!0),l.identifierPrefix!==void 0&&(n=l.identifierPrefix),l.onUncaughtError!==void 0&&(i=l.onUncaughtError),l.onCaughtError!==void 0&&(r=l.onCaughtError),l.onRecoverableError!==void 0&&(f=l.onRecoverableError),l.formState!==void 0&&(x=l.formState)),t=Gh(e,1,!0,t,l??null,a,n,x,i,r,f,Wh),t.context=kh(null),l=t.current,a=Kt(),a=Ls(a),n=ua(a),n.callback=null,sa(l,n,a),l=a,t.current.lanes=l,ni(t,l),Al(t),e[un]=t.current,Hc(e),new _s(t)},Fi.version="19.3.1",Fi}var cp;function kv(){if(cp)return fo.exports;cp=1;function s(){if(!(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__>"u"||typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE!="function"))try{__REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(s)}catch(o){console.error(o)}}return s(),fo.exports=Gv(),fo.exports}var Qv=kv();/**
 * react-router v7.18.4
 *
 * Copyright (c) Remix Software Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.md file in the root directory of this source tree.
 *
 * @license MIT
 */var jo=/^(?:[a-z][a-z0-9+.-]*:|[\\/]{2})/i,Np=/^[\\/]{2}/;function Xv(s,o){return o+s.replace(/\\/g,"/")}var op="popstate";function fp(s){return typeof s=="object"&&s!=null&&"pathname"in s&&"search"in s&&"hash"in s&&"state"in s&&"key"in s}function Vv(s={}){function o(c,d){var z;let p=(z=d.state)==null?void 0:z.masked,{pathname:v,search:T,hash:N}=p||c.location;return bo("",{pathname:v,search:T,hash:N},d.state&&d.state.usr||null,d.state&&d.state.key||"default",p?{pathname:c.location.pathname,search:c.location.search,hash:c.location.hash}:void 0)}function m(c,d){return typeof d=="string"?d:Pa(d)}return Kv(o,m,null,s)}function Pe(s,o){if(s===!1||s===null||typeof s>"u")throw new Error(o)}function rl(s,o){if(!s){typeof console<"u"&&console.warn(o);try{throw new Error(o)}catch{}}}function Zv(){return Math.random().toString(36).substring(2,10)}function dp(s,o){return{usr:s.state,key:s.key,idx:o,masked:s.mask?{pathname:s.pathname,search:s.search,hash:s.hash}:void 0}}function bo(s,o,m=null,c,d){return{pathname:typeof s=="string"?s:s.pathname,search:"",hash:"",...typeof o=="string"?Fn(o):o,state:m,key:o&&o.key||c||Zv(),mask:d}}function Pa({pathname:s="/",search:o="",hash:m=""}){return o&&o!=="?"&&(s+=o.charAt(0)==="?"?o:"?"+o),m&&m!=="#"&&(s+=m.charAt(0)==="#"?m:"#"+m),s}function Fn(s){let o={};if(s){let m=s.indexOf("#");m>=0&&(o.hash=s.substring(m),s=s.substring(0,m));let c=s.indexOf("?");c>=0&&(o.search=s.substring(c),s=s.substring(0,c)),s&&(o.pathname=s)}return o}function Kv(s,o,m,c={}){let{window:d=document.defaultView,v5Compat:p=!1}=c,v=d.history,T="POP",N=null,z=y();z==null&&(z=0,v.replaceState({...v.state,idx:z},""));function y(){return(v.state||{idx:null}).idx}function g(){T="POP";let q=y(),Y=q==null?null:q-z;z=q,N&&N({action:T,location:k.location,delta:Y})}function A(q,Y){T="PUSH";let ee=fp(q)?q:bo(k.location,q,Y);z=y()+1;let le=dp(ee,z),F=k.createHref(ee.mask||ee);try{v.pushState(le,"",F)}catch(J){if(J instanceof DOMException&&J.name==="DataCloneError")throw J;d.location.assign(F)}p&&N&&N({action:T,location:k.location,delta:1})}function B(q,Y){T="REPLACE";let ee=fp(q)?q:bo(k.location,q,Y);z=y();let le=dp(ee,z),F=k.createHref(ee.mask||ee);v.replaceState(le,"",F),p&&N&&N({action:T,location:k.location,delta:0})}function U(q){return Jv(d,q)}let k={get action(){return T},get location(){return s(d,v)},listen(q){if(N)throw new Error("A history only accepts one active listener");return d.addEventListener(op,g),N=q,()=>{d.removeEventListener(op,g),N=null}},createHref(q){return o(d,q)},createURL:U,encodeLocation(q){let Y=U(q);return{pathname:Y.pathname,search:Y.search,hash:Y.hash}},push:A,replace:B,go(q){return v.go(q)}};return k}function Jv(s,o,m=!1){let c="http://localhost";s&&(c=s.location.origin!=="null"?s.location.origin:s.location.href),Pe(c,"No window.location.(origin|href) available to create URL");let d=typeof o=="string"?o:Pa(o);return d=d.replace(/ $/,"%20"),!m&&Np.test(d)&&(d=c+d),new URL(d,c)}function _p(s,o,m="/"){return $v(s,o,m,!1)}function $v(s,o,m,c,d){let p=typeof o=="string"?Fn(o):o,v=$l(p.pathname||"/",m);if(v==null)return null;let T=Fv(s),N=null,z=s0(v);for(let y=0;N==null&&y<T.length;++y)N=u0(T[y],z,c);return N}function Fv(s){let o=jp(s);return Iv(o),o}function jp(s,o=[],m=[],c="",d=!1){let p=(v,T,N=d,z)=>{let y={relativePath:z===void 0?v.path||"":z,caseSensitive:v.caseSensitive===!0,childrenIndex:T,route:v};if(y.relativePath.startsWith("/")){if(!y.relativePath.startsWith(c)&&N)return;Pe(y.relativePath.startsWith(c),`Absolute route path "${y.relativePath}" nested under path "${c}" is not valid. An absolute child route path must start with the combined path of all its parent routes.`),y.relativePath=y.relativePath.slice(c.length)}let g=xl([c,y.relativePath]),A=m.concat(y);v.children&&v.children.length>0&&(Pe(v.index!==!0,`Index routes must not have child routes. Please remove all child routes from route path "${g}".`),jp(v.children,o,A,g,N)),!(v.path==null&&!v.index)&&o.push({path:g,score:n0(g,v.index),routesMeta:A.map((B,U)=>{let[k,q]=Cp(B.relativePath,B.caseSensitive,U===A.length-1);return{...B,matcher:k,compiledParams:q}})})};return s.forEach((v,T)=>{var N;if(v.path===""||!((N=v.path)!=null&&N.includes("?")))p(v,T);else for(let z of Ep(v.path))p(v,T,!0,z)}),o}function Ep(s){let o=s.split("/");if(o.length===0)return[];let[m,...c]=o,d=m.endsWith("?"),p=m.replace(/\?$/,"");if(c.length===0)return d?[p,""]:[p];let v=Ep(c.join("/")),T=[];return T.push(...v.map(N=>N===""?p:[p,N].join("/"))),d&&T.push(...v),T.map(N=>s.startsWith("/")&&N===""?"/":N)}function Iv(s){s.sort((o,m)=>o.score!==m.score?m.score-o.score:i0(o.routesMeta.map(c=>c.childrenIndex),m.routesMeta.map(c=>c.childrenIndex)))}var Wv=/^:[\w-]+$/,Pv=3,e0=2,t0=1,l0=10,a0=-2,mp=s=>s==="*";function n0(s,o){let m=s.split("/"),c=m.length;return m.some(mp)&&(c+=a0),o&&(c+=e0),m.filter(d=>!mp(d)).reduce((d,p)=>d+(Wv.test(p)?Pv:p===""?t0:l0),c)}function i0(s,o){return s.length===o.length&&s.slice(0,-1).every((c,d)=>c===o[d])?s[s.length-1]-o[o.length-1]:0}function u0(s,o,m=!1){let{routesMeta:c}=s,d={},p="/",v=[];for(let T=0;T<c.length;++T){let N=c[T],z=T===c.length-1,y=p==="/"?o:o.slice(p.length)||"/",g={path:N.relativePath,caseSensitive:N.caseSensitive,end:z},A=N.matcher&&N.compiledParams?Tp(g,y,N.matcher,N.compiledParams):Rs(g,y),B=N.route;if(!A&&z&&m&&!c[c.length-1].route.index&&(A=Rs({path:N.relativePath,caseSensitive:N.caseSensitive,end:!1},y)),!A)return null;Object.assign(d,A.params),v.push({params:d,pathname:xl([p,A.pathname]),pathnameBase:o0(xl([p,A.pathnameBase])),route:B}),A.pathnameBase!=="/"&&(p=xl([p,A.pathnameBase]))}return v}function Rs(s,o){typeof s=="string"&&(s={path:s,caseSensitive:!1,end:!0});let[m,c]=Cp(s.path,s.caseSensitive,s.end);return Tp(s,o,m,c)}function Tp(s,o,m,c){let d=o.match(m);if(!d)return null;let p=d[0],v=$n(p,1),T=d.slice(1);return{params:c.reduce((z,{paramName:y,isOptional:g},A)=>{if(y==="*"){let U=T[A]||"";v=$n(p.slice(0,p.length-U.length),1)}const B=T[A];return g&&!B?z[y]=void 0:z[y]=(B||"").replace(/%2F/g,"/"),z},{}),pathname:p,pathnameBase:v,pattern:s}}function Cp(s,o=!1,m=!0){rl(s==="*"||!s.endsWith("*")||s.endsWith("/*"),`Route path "${s}" will be treated as if it were "${s.replace(/\*$/,"/*")}" because the \`*\` character must always follow a \`/\` in the pattern. To get rid of this warning, please change the route path to "${s.replace(/\*$/,"/*")}".`);let c=[],d="^"+s.replace(/\/*\*?$/,"").replace(/^\/*/,"/").replace(/[\\.*+^${}|()[\]]/g,"\\$&").replace(/\/:([\w-]+)(\?)?/g,(v,T,N,z,y)=>{if(c.push({paramName:T,isOptional:N!=null}),N){let g=y.charAt(z+v.length);return g&&g!=="/"?"/([^\\/]*)":"(?:/([^\\/]*))?"}return"/([^\\/]+)"}).replace(/\/([\w-]+)\?(\/|$)/g,"(/$1)?$2");return s.endsWith("*")?(c.push({paramName:"*"}),d+=s==="*"||s==="/*"?"(.*)$":"(?:\\/(.+)|\\/*)$"):m?d+="\\/*$":s!==""&&s!=="/"&&(d+="(?:(?=\\/|$))"),[new RegExp(d,o?void 0:"i"),c]}function s0(s){try{return s.split("/").map(o=>decodeURIComponent(o).replace(/\//g,"%2F")).join("/")}catch(o){return rl(!1,`The URL path "${s}" could not be decoded because it is a malformed URL segment. This is probably due to a bad percent encoding (${o}).`),s}}function $l(s,o){if(o==="/")return s;if(!s.toLowerCase().startsWith(o.toLowerCase()))return null;let m=o.endsWith("/")?o.length-1:o.length,c=s.charAt(m);return c&&c!=="/"?null:s.slice(m)||"/"}function r0(s,o="/"){let{pathname:m,search:c="",hash:d=""}=typeof s=="string"?Fn(s):s,p;return m?(m=zp(m),m.startsWith("/")||m.startsWith("\\")?p=hp(m.substring(1),"/"):p=hp(m,o)):p=o,{pathname:p,search:f0(c),hash:d0(d)}}function hp(s,o){let m=$n(o).split("/");return s.split("/").forEach(d=>{d===".."?m.length>1&&m.pop():d!=="."&&m.push(d)}),m.length>1?m.join("/"):"/"}function go(s,o,m,c){return`Cannot include a '${s}' character in a manually specified \`to.${o}\` field [${JSON.stringify(c)}].  Please separate it out to the \`to.${m}\` field. Alternatively you may provide the full path as a string in <Link to="..."> and the router will parse it for you.`}function c0(s){return s.filter((o,m)=>m===0||o.route.path&&o.route.path.length>0)}function Eo(s){let o=c0(s);return o.map((m,c)=>c===o.length-1?m.pathname:m.pathnameBase)}function Os(s,o,m,c=!1){let d;typeof s=="string"?d=Fn(s):(d={...s},Pe(!d.pathname||!d.pathname.includes("?"),go("?","pathname","search",d)),Pe(!d.pathname||!d.pathname.includes("#"),go("#","pathname","hash",d)),Pe(!d.search||!d.search.includes("#"),go("#","search","hash",d)));let p=s===""||d.pathname==="",v=p?"/":d.pathname,T;if(v==null)T=m;else{let g=o.length-1;if(!c&&v.startsWith("..")){let A=v.split("/");for(;A[0]==="..";)A.shift(),g-=1;d.pathname=A.join("/")}T=g>=0?o[g]:"/"}let N=r0(d,T),z=v&&v!=="/"&&v.endsWith("/"),y=(p||v===".")&&m.endsWith("/");return!N.pathname.endsWith("/")&&(z||y)&&(N.pathname+="/"),N}var zp=s=>s.replace(/[\\/]{2,}/g,"/"),xl=s=>zp(s.join("/"));function $n(s,o=0){let m=s.length;for(;m>o&&s.charCodeAt(m-1)===47;)m--;return m===s.length?s:s.slice(0,m)}var o0=s=>$n(s).replace(/^\/*/,"/"),f0=s=>!s||s==="?"?"":s.startsWith("?")?s:"?"+s,d0=s=>!s||s==="#"?"":s.startsWith("#")?s:"#"+s,m0=class{constructor(s,o,m,c=!1){this.status=s,this.statusText=o||"",this.internal=c,m instanceof Error?(this.data=m.toString(),this.error=m):this.data=m}};function h0(s){return s!=null&&typeof s.status=="number"&&typeof s.statusText=="string"&&typeof s.internal=="boolean"&&"data"in s}function p0(s){let o=s.map(m=>m.route.path).filter(Boolean);return xl(o)||"/"}var Ap=typeof window<"u"&&typeof window.document<"u"&&typeof window.document.createElement<"u";function Rp(s,o){let m=s;if(typeof m!="string"||!jo.test(m))return{absoluteURL:void 0,isExternal:!1,to:m};let c=m,d=!1;if(Ap)try{let p=new URL(window.location.href),v=Np.test(m)?new URL(Xv(m,p.protocol)):new URL(m),T=$l(v.pathname,o);v.origin===p.origin&&T!=null?m=T+v.search+v.hash:d=!0}catch{rl(!1,`<Link to="${m}"> contains an invalid URL which will probably break when clicked - please update to a valid URL path.`)}return{absoluteURL:c,isExternal:d,to:m}}Object.getOwnPropertyNames(Object.prototype).sort().join("\0");var pp=new URL("http://localhost");function To(s){if(s.createURL)return s.createURL("/");try{return new URL(s.createHref("/"),pp)}catch{return pp}}function xo(s,o){return s.origin===o.origin&&(s.origin!=="null"||s.protocol===o.protocol&&s.host===o.host)}function g0(s,o){if(s.startsWith("//"))return!0;let m=o.protocol.toLowerCase();return s.toLowerCase().startsWith(m)?o.host===""||s.slice(m.length).startsWith("//"):!1}function Co(s,o,m,c){let d=null;try{d=s==null?null:new URL(s,m)}catch{}let p=new URL(o,m),v=d!=null&&!xo(d,m),T=!xo(p,m);if(c==="reject"){if(v||T)throw new Error("External navigation is not allowed")}else if(T&&(d==null||!g0(s,d)||!xo(d,p)))throw new Error("External navigation is not allowed")}var Op=["POST","PUT","PATCH","DELETE"];new Set(Op);var x0=["GET",...Op];new Set(x0);var v0=["about:","blob:","chrome:","chrome-untrusted:","content:","data:","devtools:","file:","filesystem:","javascript:"];function y0(s){try{return v0.includes(new URL(s).protocol)}catch{return!1}}var In=b.createContext(null);In.displayName="DataRouter";var ws=b.createContext(null);ws.displayName="DataRouterState";var wp=b.createContext(!1);function b0(){return b.useContext(wp)}var Mp=b.createContext({isTransitioning:!1});Mp.displayName="ViewTransition";var S0=b.createContext(new Map);S0.displayName="Fetchers";var N0=b.createContext(null);N0.displayName="Await";var $t=b.createContext(null);$t.displayName="Navigation";var Pi=b.createContext(null);Pi.displayName="Location";var Ol=b.createContext({outlet:null,matches:[],isDataRoute:!1});Ol.displayName="Route";var zo=b.createContext(null);zo.displayName="RouteError";var Dp="REACT_ROUTER_ERROR",_0="REDIRECT",j0="ROUTE_ERROR_RESPONSE";function E0(s){if(s.startsWith(`${Dp}:${_0}:{`))try{let o=JSON.parse(s.slice(28));if(typeof o=="object"&&o&&typeof o.status=="number"&&typeof o.statusText=="string"&&typeof o.location=="string"&&typeof o.reloadDocument=="boolean"&&typeof o.replace=="boolean")return o}catch{}}function T0(s){if(s.startsWith(`${Dp}:${j0}:{`))try{let o=JSON.parse(s.slice(40));if(typeof o=="object"&&o&&typeof o.status=="number"&&typeof o.statusText=="string")return new m0(o.status,o.statusText,o.data)}catch{}}function C0(s,{relative:o}={}){Pe(Wn(),"useHref() may be used only in the context of a <Router> component.");let{basename:m,navigator:c}=b.useContext($t),{hash:d,pathname:p,search:v}=eu(s,{relative:o}),T=p;return m!=="/"&&(T=p==="/"?m:xl([m,p])),c.createHref({pathname:T,search:v,hash:d})}function Wn(){return b.useContext(Pi)!=null}function cl(){return Pe(Wn(),"useLocation() may be used only in the context of a <Router> component."),b.useContext(Pi).location}var Up="You should call navigate() in a React.useEffect(), not when your component is first rendered.";function Lp(s){b.useContext($t).static||b.useLayoutEffect(s)}function ja(){let{isDataRoute:s}=b.useContext(Ol);return s?Y0():z0()}function z0(){Pe(Wn(),"useNavigate() may be used only in the context of a <Router> component.");let s=b.useContext(In),{basename:o,navigator:m}=b.useContext($t),{matches:c}=b.useContext(Ol),{pathname:d}=cl(),p=JSON.stringify(Eo(c)),v=b.useRef(!1);return Lp(()=>{v.current=!0}),b.useCallback((N,z={})=>{if(rl(v.current,Up),!v.current)return;if(typeof N=="number"){m.go(N);return}let y=Os(N,JSON.parse(p),d,z.relative==="path");s==null&&o!=="/"&&(y.pathname=y.pathname==="/"?o:xl([o,y.pathname])),Co(typeof N=="string"?N:Pa(N),m.createHref(y),To(m),"reject"),(z.replace?m.replace:m.push)(y,z.state,z)},[o,m,p,d,s])}b.createContext(null);function eu(s,{relative:o}={}){let{matches:m}=b.useContext(Ol),{pathname:c}=cl(),d=JSON.stringify(Eo(m));return b.useMemo(()=>Os(s,JSON.parse(d),c,o==="path"),[s,d,c,o])}function A0(s,o){return Hp(s,o)}function Hp(s,o,m){var q;Pe(Wn(),"useRoutes() may be used only in the context of a <Router> component.");let{navigator:c}=b.useContext($t),{matches:d}=b.useContext(Ol),p=d[d.length-1],v=p?p.params:{},T=p?p.pathname:"/",N=p?p.pathnameBase:"/",z=p&&p.route;{let Y=z&&z.path||"";qp(T,!z||Y.endsWith("*")||Y.endsWith("*?"),`You rendered descendant <Routes> (or called \`useRoutes()\`) at "${T}" (under <Route path="${Y}">) but the parent route path has no trailing "*". This means if you navigate deeper, the parent won't match anymore and therefore the child routes will never render.

Please change the parent <Route path="${Y}"> to <Route path="${Y==="/"?"*":`${Y}/*`}">.`)}let y=cl(),g;if(o){let Y=typeof o=="string"?Fn(o):o;Pe(N==="/"||((q=Y.pathname)==null?void 0:q.startsWith(N)),`When overriding the location using \`<Routes location>\` or \`useRoutes(routes, location)\`, the location pathname must begin with the portion of the URL pathname that was matched by all parent routes. The current pathname base is "${N}" but pathname "${Y.pathname}" was given in the \`location\` prop.`),g=Y}else g=y;let A=g.pathname||"/",B=A;if(N!=="/"){let Y=N.replace(/^\//,"").split("/");B="/"+A.replace(/^\//,"").split("/").slice(Y.length).join("/")}let U=m&&m.state.matches.length?m.state.matches.map(Y=>Object.assign(Y,{route:m.manifest[Y.route.id]||Y.route})):_p(s,{pathname:B});rl(z||U!=null,`No routes matched location "${g.pathname}${g.search}${g.hash}" `),rl(U==null||U[U.length-1].route.element!==void 0||U[U.length-1].route.Component!==void 0||U[U.length-1].route.lazy!==void 0,`Matched leaf route at location "${g.pathname}${g.search}${g.hash}" does not have an element or Component. This means it will render an <Outlet /> with a null value by default resulting in an "empty" page.`);let k=D0(U&&U.map(Y=>Object.assign({},Y,{params:Object.assign({},v,Y.params),pathname:xl([N,c.encodeLocation?c.encodeLocation(Y.pathname.replace(/%/g,"%25").replace(/\?/g,"%3F").replace(/#/g,"%23")).pathname:Y.pathname]),pathnameBase:Y.pathnameBase==="/"?N:xl([N,c.encodeLocation?c.encodeLocation(Y.pathnameBase.replace(/%/g,"%25").replace(/\?/g,"%3F").replace(/#/g,"%23")).pathname:Y.pathnameBase])})),d,m);return o&&k?b.createElement(Pi.Provider,{value:{location:{pathname:"/",search:"",hash:"",state:null,key:"default",mask:void 0,...g},navigationType:"POP"}},k):k}function R0(){let s=q0(),o=h0(s)?`${s.status} ${s.statusText}`:s instanceof Error?s.message:JSON.stringify(s),m=s instanceof Error?s.stack:null,c="rgba(200,200,200, 0.5)",d={padding:"0.5rem",backgroundColor:c},p={padding:"2px 4px",backgroundColor:c},v=null;return console.error("Error handled by React Router default ErrorBoundary:",s),v=b.createElement(b.Fragment,null,b.createElement("p",null,"💿 Hey developer 👋"),b.createElement("p",null,"You can provide a way better UX than this when your app throws errors by providing your own ",b.createElement("code",{style:p},"ErrorBoundary")," or"," ",b.createElement("code",{style:p},"errorElement")," prop on your route.")),b.createElement(b.Fragment,null,b.createElement("h2",null,"Unexpected Application Error!"),b.createElement("h3",{style:{fontStyle:"italic"}},o),m?b.createElement("pre",{style:d},m):null,v)}var O0=b.createElement(R0,null),Bp=class extends b.Component{constructor(s){super(s),this.state={location:s.location,revalidation:s.revalidation,error:s.error}}static getDerivedStateFromError(s){return{error:s}}static getDerivedStateFromProps(s,o){return o.location!==s.location||o.revalidation!=="idle"&&s.revalidation==="idle"?{error:s.error,location:s.location,revalidation:s.revalidation}:{error:s.error!==void 0?s.error:o.error,location:o.location,revalidation:s.revalidation||o.revalidation}}componentDidCatch(s,o){this.props.onError?this.props.onError(s,o):console.error("React Router caught the following error during render",s)}render(){let s=this.state.error;if(this.context&&typeof s=="object"&&s&&"digest"in s&&typeof s.digest=="string"){const m=T0(s.digest);m&&(s=m)}let o=s!==void 0?b.createElement(Ol.Provider,{value:this.props.routeContext},b.createElement(zo.Provider,{value:s,children:this.props.component})):this.props.children;return this.context?b.createElement(w0,{error:s},o):o}};Bp.contextType=wp;var vo=new WeakMap;function w0({children:s,error:o}){let{basename:m,navigator:c}=b.useContext($t);if(typeof o=="object"&&o&&"digest"in o&&typeof o.digest=="string"){let d=E0(o.digest);if(d){let p=vo.get(o);if(p)throw p;let v=Rp(d.location,m),T=v.absoluteURL||v.to;if(Co(d.location,T,To(c),"allow-explicit"),y0(T))throw new Error("Invalid redirect location");if(Ap&&!vo.get(o))if(v.isExternal||d.reloadDocument)window.location.href=T;else{const N=Promise.resolve().then(()=>window.__reactRouterDataRouter.navigate(v.to,{replace:d.replace}));throw vo.set(o,N),N}return b.createElement("meta",{httpEquiv:"refresh",content:`0;url=${T}`})}}return s}function M0({routeContext:s,match:o,children:m}){let c=b.useContext(In);return c&&c.static&&c.staticContext&&(o.route.errorElement||o.route.ErrorBoundary)&&(c.staticContext._deepestRenderedBoundaryId=o.route.id),b.createElement(Ol.Provider,{value:s},m)}function D0(s,o=[],m){let c=m==null?void 0:m.state;if(s==null){if(!c)return null;if(c.errors)s=c.matches;else if(o.length===0&&!c.initialized&&c.matches.length>0)s=c.matches;else return null}let d=s,p=c==null?void 0:c.errors;if(p!=null){let y=d.findIndex(g=>g.route.id&&(p==null?void 0:p[g.route.id])!==void 0);Pe(y>=0,`Could not find a matching route for errors on route IDs: ${Object.keys(p).join(",")}`),d=d.slice(0,Math.min(d.length,y+1))}let v=!1,T=-1;if(m&&c){v=c.renderFallback;for(let y=0;y<d.length;y++){let g=d[y];if((g.route.HydrateFallback||g.route.hydrateFallbackElement)&&(T=y),g.route.id){let{loaderData:A,errors:B}=c,U=g.route.loader&&!A.hasOwnProperty(g.route.id)&&(!B||B[g.route.id]===void 0);if(g.route.lazy||U){m.isStatic&&(v=!0),T>=0?d=d.slice(0,T+1):d=[d[0]];break}}}}let N=m==null?void 0:m.onError,z=c&&N?(y,g)=>{var A,B;N(y,{location:c.location,params:((B=(A=c.matches)==null?void 0:A[0])==null?void 0:B.params)??{},pattern:p0(c.matches),errorInfo:g})}:void 0;return d.reduceRight((y,g,A)=>{let B,U=!1,k=null,q=null;c&&(B=p&&g.route.id?p[g.route.id]:void 0,k=g.route.errorElement||O0,v&&(T<0&&A===0?(qp("route-fallback",!1,"No `HydrateFallback` element provided to render during initial hydration"),U=!0,q=null):T===A&&(U=!0,q=g.route.hydrateFallbackElement||null)));let Y=o.concat(d.slice(0,A+1)),ee=()=>{let le;return B?le=k:U?le=q:g.route.Component?le=b.createElement(g.route.Component,null):g.route.element?le=g.route.element:le=y,b.createElement(M0,{match:g,routeContext:{outlet:y,matches:Y,isDataRoute:c!=null},children:le})};return c&&(g.route.ErrorBoundary||g.route.errorElement||A===0)?b.createElement(Bp,{location:c.location,revalidation:c.revalidation,component:k,error:B,children:ee(),routeContext:{outlet:null,matches:Y,isDataRoute:!0},onError:z}):ee()},null)}function Ao(s){return`${s} must be used within a data router.  See https://reactrouter.com/en/main/routers/picking-a-router.`}function U0(s){let o=b.useContext(In);return Pe(o,Ao(s)),o}function L0(s){let o=b.useContext(ws);return Pe(o,Ao(s)),o}function H0(s){let o=b.useContext(Ol);return Pe(o,Ao(s)),o}function Ro(s){let o=H0(s),m=o.matches[o.matches.length-1];return Pe(m.route.id,`${s} can only be used on routes that contain a unique "id"`),m.route.id}function B0(){return Ro("useRouteId")}function q0(){var c;let s=b.useContext(zo),o=L0("useRouteError"),m=Ro("useRouteError");return s!==void 0?s:(c=o.errors)==null?void 0:c[m]}function Y0(){let{router:s}=U0("useNavigate"),o=Ro("useNavigate"),m=b.useRef(!1);return Lp(()=>{m.current=!0}),b.useCallback(async(d,p={})=>{rl(m.current,Up),m.current&&(typeof d=="number"?await s.navigate(d):await s.navigate(d,{fromRouteId:o,...p}))},[s,o])}var gp={};function qp(s,o,m){!o&&!gp[s]&&(gp[s]=!0,rl(!1,m))}b.memo(G0);function G0({routes:s,manifest:o,future:m,state:c,isStatic:d,onError:p}){return Hp(s,void 0,{manifest:o,state:c,isStatic:d,onError:p})}function xp({to:s,replace:o,state:m,relative:c}){Pe(Wn(),"<Navigate> may be used only in the context of a <Router> component.");let{static:d,navigator:p}=b.useContext($t);rl(!d,"<Navigate> must not be used on the initial render in a <StaticRouter>. This is a no-op, but you should modify your code so the <Navigate> is only ever rendered in response to some user interaction or state change.");let{matches:v}=b.useContext(Ol),{pathname:T}=cl(),N=ja(),z=Os(s,Eo(v),T,c==="path");Co(typeof s=="string"?s:Pa(s),p.createHref(z),To(p),"reject");let y=JSON.stringify(z);return b.useEffect(()=>{N(JSON.parse(y),{replace:o,state:m,relative:c})},[N,y,c,o,m]),null}function Rl(s){Pe(!1,"A <Route> is only ever to be used as the child of <Routes> element, never rendered directly. Please wrap your <Route> in a <Routes>.")}function k0({basename:s="/",children:o=null,location:m,navigationType:c="POP",navigator:d,static:p=!1,useTransitions:v}){Pe(!Wn(),"You cannot render a <Router> inside another <Router>. You should never have more than one in your app.");let T=s.replace(/^\/*/,"/"),N=b.useMemo(()=>({basename:T,navigator:d,static:p,useTransitions:v,future:{}}),[T,d,p,v]);typeof m=="string"&&(m=Fn(m));let{pathname:z="/",search:y="",hash:g="",state:A=null,key:B="default",mask:U}=m,k=b.useMemo(()=>{let q=$l(z,T);return q==null?null:{location:{pathname:q,search:y,hash:g,state:A,key:B,mask:U},navigationType:c}},[T,z,y,g,A,B,c,U]);return rl(k!=null,`<Router basename="${T}"> is not able to match the URL "${z}${y}${g}" because it does not start with the basename, so the <Router> won't render anything.`),k==null?null:b.createElement($t.Provider,{value:N},b.createElement(Pi.Provider,{children:o,value:k}))}function Q0({children:s,location:o}){return A0(So(s),o)}function So(s,o=[]){let m=[];return b.Children.forEach(s,(c,d)=>{if(!b.isValidElement(c))return;let p=[...o,d];if(c.type===b.Fragment){m.push.apply(m,So(c.props.children,p));return}Pe(c.type===Rl,`[${typeof c.type=="string"?c.type:c.type.name}] is not a <Route> component. All component children of <Routes> must be a <Route> or <React.Fragment>`),Pe(!c.props.index||!c.props.children,"An index route cannot have child routes.");let v={id:c.props.id||p.join("-"),caseSensitive:c.props.caseSensitive,element:c.props.element,Component:c.props.Component,index:c.props.index,path:c.props.path,middleware:c.props.middleware,loader:c.props.loader,action:c.props.action,hydrateFallbackElement:c.props.hydrateFallbackElement,HydrateFallback:c.props.HydrateFallback,errorElement:c.props.errorElement,ErrorBoundary:c.props.ErrorBoundary,hasErrorBoundary:c.props.hasErrorBoundary===!0||c.props.ErrorBoundary!=null||c.props.errorElement!=null,shouldRevalidate:c.props.shouldRevalidate,handle:c.props.handle,lazy:c.props.lazy};c.props.children&&(v.children=So(c.props.children,p)),m.push(v)}),m}var zs="get",As="application/x-www-form-urlencoded";function Ms(s){return typeof HTMLElement<"u"&&s instanceof HTMLElement}function X0(s){return Ms(s)&&s.tagName.toLowerCase()==="button"}function V0(s){return Ms(s)&&s.tagName.toLowerCase()==="form"}function Z0(s){return Ms(s)&&s.tagName.toLowerCase()==="input"}function K0(s){return!!(s.metaKey||s.altKey||s.ctrlKey||s.shiftKey)}function J0(s,o){return s.button===0&&(!o||o==="_self")&&!K0(s)}function No(s=""){return new URLSearchParams(typeof s=="string"||Array.isArray(s)||s instanceof URLSearchParams?s:Object.keys(s).reduce((o,m)=>{let c=s[m];return o.concat(Array.isArray(c)?c.map(d=>[m,d]):[[m,c]])},[]))}function $0(s,o){let m=No(s);return o&&o.forEach((c,d)=>{m.has(d)||o.getAll(d).forEach(p=>{m.append(d,p)})}),m}var Es=null;function F0(){if(Es===null)try{new FormData(document.createElement("form"),0),Es=!1}catch{Es=!0}return Es}var I0=new Set(["application/x-www-form-urlencoded","multipart/form-data","text/plain"]);function yo(s){return s!=null&&!I0.has(s)?(rl(!1,`"${s}" is not a valid \`encType\` for \`<Form>\`/\`<fetcher.Form>\` and will default to "${As}"`),null):s}function W0(s,o){let m,c,d,p,v;if(V0(s)){let T=s.getAttribute("action");c=T?$l(T,o):null,m=s.getAttribute("method")||zs,d=yo(s.getAttribute("enctype"))||As,p=new FormData(s)}else if(X0(s)||Z0(s)&&(s.type==="submit"||s.type==="image")){let T=s.form;if(T==null)throw new Error('Cannot submit a <button> or <input type="submit"> without a <form>');let N=s.getAttribute("formaction")||T.getAttribute("action");if(c=N?$l(N,o):null,m=s.getAttribute("formmethod")||T.getAttribute("method")||zs,d=yo(s.getAttribute("formenctype"))||yo(T.getAttribute("enctype"))||As,p=new FormData(T,s),!F0()){let{name:z,type:y,value:g}=s;if(y==="image"){let A=z?`${z}.`:"";p.append(`${A}x`,"0"),p.append(`${A}y`,"0")}else z&&p.append(z,g)}}else{if(Ms(s))throw new Error('Cannot submit element that is not <form>, <button>, or <input type="submit|image">');m=zs,c=null,d=As,v=s}return p&&d==="text/plain"&&(v=p,p=void 0),{action:c,method:m.toLowerCase(),encType:d,formData:p,body:v}}Object.getOwnPropertyNames(Object.prototype).sort().join("\0");function Oo(s,o){if(s===!1||s===null||typeof s>"u")throw new Error(o)}function Yp(s,o,m,c){let d=typeof s=="string"?new URL(s,typeof window>"u"?"server://singlefetch/":window.location.origin):s;return m?d.pathname.endsWith("/")?d.pathname=`${d.pathname}_.${c}`:d.pathname=`${d.pathname}.${c}`:d.pathname==="/"?d.pathname=`_root.${c}`:o&&$l(d.pathname,o)==="/"?d.pathname=`${$n(o)}/_root.${c}`:d.pathname=`${$n(d.pathname)}.${c}`,d}async function P0(s,o){if(s.id in o)return o[s.id];try{let m=await import(s.module);return o[s.id]=m,m}catch(m){return console.error(`Error loading route module \`${s.module}\`, reloading page...`),console.error(m),window.__reactRouterContext&&window.__reactRouterContext.isSpaMode,window.location.reload(),new Promise(()=>{})}}function ey(s){return s==null?!1:s.href==null?s.rel==="preload"&&typeof s.imageSrcSet=="string"&&typeof s.imageSizes=="string":typeof s.rel=="string"&&typeof s.href=="string"}async function ty(s,o,m){let c=await Promise.all(s.map(async d=>{let p=o.routes[d.route.id];if(p){let v=await P0(p,m);return v.links?v.links():[]}return[]}));return iy(c.flat(1).filter(ey).filter(d=>d.rel==="stylesheet"||d.rel==="preload").map(d=>d.rel==="stylesheet"?{...d,rel:"prefetch",as:"style"}:{...d,rel:"prefetch"}))}function vp(s,o,m,c,d,p){let v=(N,z)=>m[z]?N.route.id!==m[z].route.id:!0,T=(N,z)=>{var y;return m[z].pathname!==N.pathname||((y=m[z].route.path)==null?void 0:y.endsWith("*"))&&m[z].params["*"]!==N.params["*"]};return p==="assets"?o.filter((N,z)=>v(N,z)||T(N,z)):p==="data"?o.filter((N,z)=>{var g;let y=c.routes[N.route.id];if(!y||!y.hasLoader)return!1;if(v(N,z)||T(N,z))return!0;if(N.route.shouldRevalidate){let A=N.route.shouldRevalidate({currentUrl:new URL(d.pathname+d.search+d.hash,window.origin),currentParams:((g=m[0])==null?void 0:g.params)||{},nextUrl:new URL(s,window.origin),nextParams:N.params,defaultShouldRevalidate:!0});if(typeof A=="boolean")return A}return!0}):[]}function ly(s,o,{includeHydrateFallback:m}={}){return ay(s.map(c=>{let d=o.routes[c.route.id];if(!d)return[];let p=[d.module];return d.clientActionModule&&(p=p.concat(d.clientActionModule)),d.clientLoaderModule&&(p=p.concat(d.clientLoaderModule)),m&&d.hydrateFallbackModule&&(p=p.concat(d.hydrateFallbackModule)),d.imports&&(p=p.concat(d.imports)),p}).flat(1))}function ay(s){return[...new Set(s)]}function ny(s){let o={},m=Object.keys(s).sort();for(let c of m)o[c]=s[c];return o}function iy(s,o){let m=new Set;return new Set(o),s.reduce((c,d)=>{let p=JSON.stringify(ny(d));return m.has(p)||(m.add(p),c.push({key:p,link:d})),c},[])}function wo(){let s=b.useContext(In);return Oo(s,"You must render this element inside a <DataRouterContext.Provider> element"),s}function uy(){let s=b.useContext(ws);return Oo(s,"You must render this element inside a <DataRouterStateContext.Provider> element"),s}var Mo=b.createContext(void 0);Mo.displayName="FrameworkContext";function Ds(){let s=b.useContext(Mo);return Oo(s,"You must render this element inside a <HydratedRouter> element"),s}function sy(s,o){let m=b.useContext(Mo),[c,d]=b.useState(!1),[p,v]=b.useState(!1),{onFocus:T,onBlur:N,onMouseEnter:z,onMouseLeave:y,onTouchStart:g}=o,A=b.useRef(null);b.useEffect(()=>{if(s==="render"&&v(!0),s==="viewport"){let k=Y=>{Y.forEach(ee=>{v(ee.isIntersecting)})},q=new IntersectionObserver(k,{threshold:.5});return A.current&&q.observe(A.current),()=>{q.disconnect()}}},[s]),b.useEffect(()=>{if(c){let k=setTimeout(()=>{v(!0)},100);return()=>{clearTimeout(k)}}},[c]);let B=()=>{d(!0)},U=()=>{d(!1),v(!1)};return m?s!=="intent"?[p,A,{}]:[p,A,{onFocus:Ii(T,B),onBlur:Ii(N,U),onMouseEnter:Ii(z,B),onMouseLeave:Ii(y,U),onTouchStart:Ii(g,B)}]:[!1,A,{}]}function Ii(s,o){return m=>{s&&s(m),m.defaultPrevented||o(m)}}function ry({page:s,...o}){let m=b0(),{nonce:c}=Ds(),{router:d}=wo(),p=b.useMemo(()=>_p(d.routes,s,d.basename),[d.routes,s,d.basename]);return p?(o.nonce==null&&c&&(o={...o,nonce:c}),m?b.createElement(oy,{page:s,matches:p,...o}):b.createElement(fy,{page:s,matches:p,...o})):null}function cy(s){let{manifest:o,routeModules:m}=Ds(),[c,d]=b.useState([]);return b.useEffect(()=>{let p=!1;return ty(s,o,m).then(v=>{p||d(v)}),()=>{p=!0}},[s,o,m]),c}function oy({page:s,matches:o,...m}){let c=cl(),{future:d}=Ds(),{basename:p}=wo(),v=b.useMemo(()=>{if(s===c.pathname+c.search+c.hash)return[];let T=Yp(s,p,d.v8_trailingSlashAwareDataRequests,"rsc"),N=!1,z=[];for(let y of o)typeof y.route.shouldRevalidate=="function"?N=!0:z.push(y.route.id);return N&&z.length>0&&T.searchParams.set("_routes",z.join(",")),[T.pathname+T.search]},[p,d.v8_trailingSlashAwareDataRequests,s,c,o]);return b.createElement(b.Fragment,null,v.map(T=>b.createElement("link",{key:T,rel:"prefetch",as:"fetch",href:T,...m})))}function fy({page:s,matches:o,...m}){let c=cl(),{future:d,manifest:p,routeModules:v}=Ds(),{basename:T}=wo(),{loaderData:N,matches:z}=uy(),y=b.useMemo(()=>vp(s,o,z,p,c,"data"),[s,o,z,p,c]),g=b.useMemo(()=>vp(s,o,z,p,c,"assets"),[s,o,z,p,c]),A=b.useMemo(()=>{if(s===c.pathname+c.search+c.hash)return[];let k=new Set,q=!1;if(o.forEach(ee=>{var F;let le=p.routes[ee.route.id];!le||!le.hasLoader||(!y.some(J=>J.route.id===ee.route.id)&&ee.route.id in N&&((F=v[ee.route.id])!=null&&F.shouldRevalidate)||le.hasClientLoader?q=!0:k.add(ee.route.id))}),k.size===0)return[];let Y=Yp(s,T,d.v8_trailingSlashAwareDataRequests,"data");return q&&k.size>0&&Y.searchParams.set("_routes",o.filter(ee=>k.has(ee.route.id)).map(ee=>ee.route.id).join(",")),[Y.pathname+Y.search]},[T,d.v8_trailingSlashAwareDataRequests,N,c,p,y,o,s,v]),B=b.useMemo(()=>ly(g,p),[g,p]),U=cy(g);return b.createElement(b.Fragment,null,A.map(k=>b.createElement("link",{key:k,rel:"prefetch",as:"fetch",href:k,...m})),B.map(k=>b.createElement("link",{key:k,rel:"modulepreload",href:k,...m})),U.map(({key:k,link:q})=>b.createElement("link",{key:k,nonce:m.nonce,...q,crossOrigin:q.crossOrigin??m.crossOrigin})))}function dy(...s){return o=>{s.forEach(m=>{typeof m=="function"?m(o):m!=null&&(m.current=o)})}}var my=typeof window<"u"&&typeof window.document<"u"&&typeof window.document.createElement<"u";try{my&&(window.__reactRouterVersion="7.18.4")}catch{}function hy({basename:s,children:o,useTransitions:m,window:c}){let d=b.useRef();d.current==null&&(d.current=Vv({window:c,v5Compat:!0}));let p=d.current,[v,T]=b.useState({action:p.action,location:p.location}),N=b.useCallback(z=>{m===!1?T(z):b.startTransition(()=>T(z))},[m]);return b.useLayoutEffect(()=>p.listen(N),[p,N]),b.createElement(k0,{basename:s,children:o,location:v.location,navigationType:v.action,navigator:p,useTransitions:m})}var Gp=b.forwardRef(function({onClick:o,discover:m="render",prefetch:c="none",relative:d,reloadDocument:p,replace:v,mask:T,state:N,target:z,to:y,preventScrollReset:g,viewTransition:A,defaultShouldRevalidate:B,...U},k){let{basename:q,navigator:Y,useTransitions:ee}=b.useContext($t),le=typeof y=="string"&&jo.test(y),F=Rp(y,q);y=F.to;let J=C0(y,{relative:d}),xe=cl(),I=null;if(T){let je=Os(T,[],xe.mask?xe.mask.pathname:"/",!0);q!=="/"&&(je.pathname=je.pathname==="/"?q:xl([q,je.pathname])),I=Y.createHref(je)}let[ie,He,Z]=sy(c,U),Be=xy(y,{replace:v,mask:T,state:N,target:z,preventScrollReset:g,relative:d,viewTransition:A,defaultShouldRevalidate:B,useTransitions:ee});function Ne(je){o&&o(je),je.defaultPrevented||Be(je)}let Ee=!(F.isExternal||p),Fe=b.createElement("a",{...U,...Z,href:(Ee?I:void 0)||F.absoluteURL||J,onClick:Ee?Ne:o,ref:dy(k,He),target:z,"data-discover":!le&&m==="render"?"true":void 0});return ie&&!le?b.createElement(b.Fragment,null,Fe,b.createElement(ry,{page:J})):Fe});Gp.displayName="Link";var kp=b.forwardRef(function({"aria-current":o="page",caseSensitive:m=!1,className:c="",end:d=!1,style:p,to:v,viewTransition:T,children:N,...z},y){let g=eu(v,{relative:z.relative}),A=cl(),B=b.useContext(ws),{navigator:U,basename:k}=b.useContext($t),q=B!=null&&Ny(g)&&T===!0,Y=U.encodeLocation?U.encodeLocation(g).pathname:g.pathname,ee=A.pathname,le=B&&B.navigation&&B.navigation.location?B.navigation.location.pathname:null;m||(ee=ee.toLowerCase(),le=le?le.toLowerCase():null,Y=Y.toLowerCase()),le&&k&&(le=$l(le,k)||le);const F=Y!=="/"&&Y.endsWith("/")?Y.length-1:Y.length;let J=ee===Y||!d&&ee.startsWith(Y)&&ee.charAt(F)==="/",xe=le!=null&&(le===Y||!d&&le.startsWith(Y)&&le.charAt(Y.length)==="/"),I={isActive:J,isPending:xe,isTransitioning:q},ie=J?o:void 0,He;typeof c=="function"?He=c(I):He=[c,J?"active":null,xe?"pending":null,q?"transitioning":null].filter(Boolean).join(" ");let Z=typeof p=="function"?p(I):p;return b.createElement(Gp,{...z,"aria-current":ie,className:He,ref:y,style:Z,to:v,viewTransition:T},typeof N=="function"?N(I):N)});kp.displayName="NavLink";var py=b.forwardRef(({discover:s="render",fetcherKey:o,navigate:m,reloadDocument:c,replace:d,state:p,method:v=zs,action:T,onSubmit:N,relative:z,preventScrollReset:y,viewTransition:g,defaultShouldRevalidate:A,...B},U)=>{let{useTransitions:k}=b.useContext($t),q=by(),Y=Sy(T,{relative:z}),ee=v.toLowerCase()==="get"?"get":"post",le=typeof T=="string"&&jo.test(T),F=J=>{if(N&&N(J),J.defaultPrevented)return;J.preventDefault();let xe=J.nativeEvent.submitter,I=(xe==null?void 0:xe.getAttribute("formmethod"))||v,ie=()=>q(xe||J.currentTarget,{fetcherKey:o,method:I,navigate:m,replace:d,state:p,relative:z,preventScrollReset:y,viewTransition:g,defaultShouldRevalidate:A});k&&m!==!1?b.startTransition(()=>ie()):ie()};return b.createElement("form",{ref:U,method:ee,action:Y,onSubmit:c?N:F,...B,"data-discover":!le&&s==="render"?"true":void 0})});py.displayName="Form";function gy(s){return`${s} must be used within a data router.  See https://reactrouter.com/en/main/routers/picking-a-router.`}function Qp(s){let o=b.useContext(In);return Pe(o,gy(s)),o}function xy(s,{target:o,replace:m,mask:c,state:d,preventScrollReset:p,relative:v,viewTransition:T,defaultShouldRevalidate:N,useTransitions:z}={}){let y=ja(),g=cl(),A=eu(s,{relative:v});return b.useCallback(B=>{if(J0(B,o)){B.preventDefault();let U=m!==void 0?m:Pa(g)===Pa(A),k=()=>y(s,{replace:U,mask:c,state:d,preventScrollReset:p,relative:v,viewTransition:T,defaultShouldRevalidate:N});z?b.startTransition(()=>k()):k()}},[g,y,A,m,c,d,o,s,p,v,T,N,z])}function Xp(s){rl(typeof URLSearchParams<"u","You cannot use the `useSearchParams` hook in a browser that does not support the URLSearchParams API. If you need to support Internet Explorer 11, we recommend you load a polyfill such as https://github.com/ungap/url-search-params.");let o=b.useRef(No(s)),m=b.useRef(!1),c=cl(),d=b.useMemo(()=>$0(c.search,m.current?null:o.current),[c.search]),p=ja(),v=b.useCallback((T,N)=>{const z=No(typeof T=="function"?T(new URLSearchParams(d)):T);m.current=!0,p("?"+z,N)},[p,d]);return[d,v]}var vy=0,yy=()=>`__${String(++vy)}__`;function by(){let{router:s}=Qp("useSubmit"),{basename:o}=b.useContext($t),m=B0(),c=s.fetch,d=s.navigate;return b.useCallback(async(p,v={})=>{let{action:T,method:N,encType:z,formData:y,body:g}=W0(p,o);if(v.navigate===!1){let A=v.fetcherKey||yy();await c(A,m,v.action||T,{defaultShouldRevalidate:v.defaultShouldRevalidate,preventScrollReset:v.preventScrollReset,formData:y,body:g,formMethod:v.method||N,formEncType:v.encType||z,flushSync:v.flushSync})}else await d(v.action||T,{defaultShouldRevalidate:v.defaultShouldRevalidate,preventScrollReset:v.preventScrollReset,formData:y,body:g,formMethod:v.method||N,formEncType:v.encType||z,replace:v.replace,state:v.state,fromRouteId:m,flushSync:v.flushSync,viewTransition:v.viewTransition})},[c,d,o,m])}function Sy(s,{relative:o}={}){let{basename:m}=b.useContext($t),c=b.useContext(Ol);Pe(c,"useFormAction must be used inside a RouteContext");let[d]=c.matches.slice(-1),p={...eu(s||".",{relative:o})},v=cl();if(s==null){p.search=v.search;let T=new URLSearchParams(p.search),N=T.getAll("index");if(N.some(y=>y==="")){T.delete("index"),N.filter(g=>g).forEach(g=>T.append("index",g));let y=T.toString();p.search=y?`?${y}`:""}}return(!s||s===".")&&d.route.index&&(p.search=p.search?p.search.replace(/^\?/,"?index&"):"?index"),m!=="/"&&(p.pathname=p.pathname==="/"?m:xl([m,p.pathname])),Pa(p)}function Ny(s,{relative:o}={}){let m=b.useContext(Mp);Pe(m!=null,"`useViewTransitionState` must be used within `react-router-dom`'s `RouterProvider`.  Did you accidentally import `RouterProvider` from `react-router`?");let{basename:c}=Qp("useViewTransitionState"),d=eu(s,{relative:o});if(!m.isTransitioning)return!1;let p=$l(m.currentLocation.pathname,c)||m.currentLocation.pathname,v=$l(m.nextLocation.pathname,c)||m.nextLocation.pathname;return Rs(d.pathname,v)!=null||Rs(d.pathname,p)!=null}const _y=({stats:s,health:o,apiError:m,onSearchSubmit:c,onReindex:d,onRetryConnection:p,isReindexing:v,isRetrying:T=!1})=>{const[N,z]=b.useState(""),y=q=>{q.key==="Enter"&&N.trim()&&c(N.trim())},g=!!(o!=null&&o.ok&&!m),A=(s==null?void 0:s.repo_name)||(o==null?void 0:o.repo_name)||"fastAST",B=(s==null?void 0:s.symbols)??(o==null?void 0:o.symbol_count),U=(s==null?void 0:s.files)??(o==null?void 0:o.file_count),k=(s==null?void 0:s.edges)??(o==null?void 0:o.edge_count);return u.jsxs("header",{className:"app-header",children:[u.jsxs("div",{className:"header-left",children:[u.jsxs("div",{className:"brand-title",children:[u.jsx("span",{className:"material-symbols-outlined brand-icon",children:"hub"}),u.jsx("span",{className:"brand-name",children:"FastAST"}),u.jsx("span",{className:"brand-tag",children:"LENS"})]}),u.jsxs("div",{className:"repo-badge",title:(s==null?void 0:s.repo_path)||(o==null?void 0:o.repo_path)||"",children:[u.jsx("span",{className:"material-symbols-outlined text-xs text-outline",children:"folder_code"}),u.jsx("span",{className:"repo-name",children:A}),u.jsxs("span",{className:`status-pill ${g?"status-pill-online":"status-pill-offline"} ${T?"opacity-70 pointer-events-none":""}`,onClick:!g&&!T?p:void 0,title:g?`Connected to ${(o==null?void 0:o.db_path)||".fastast.db"}`:m||"API server unreachable on port 4200",children:[u.jsx("span",{className:`status-dot ${g?"dot-online":"dot-offline"}`}),g?"API :4200":T?"Connecting...":"API Offline • Retry"]})]})]}),u.jsxs("div",{className:"header-search-wrap",children:[u.jsx("span",{className:"material-symbols-outlined search-icon",children:"search"}),u.jsx("input",{type:"text",value:N,onChange:q=>z(q.target.value),onKeyDown:y,placeholder:"Search symbols, files, or query evidence (Enter)...",className:"header-search-input"}),N&&u.jsx("button",{className:"search-clear-btn",onClick:()=>z(""),title:"Clear search",children:"×"})]}),u.jsxs("div",{className:"header-right",children:[g?u.jsxs("div",{className:"telemetry-group",children:[u.jsxs("div",{className:"telemetry-pill",title:"Indexed files in .fastast.db",children:[u.jsx("span",{className:"telemetry-val",children:U!==void 0?U.toLocaleString():"—"}),u.jsx("span",{className:"telemetry-lbl",children:"files"})]}),u.jsxs("div",{className:"telemetry-pill",title:"Extracted AST symbols",children:[u.jsx("span",{className:"telemetry-val text-primary",children:B!==void 0?B.toLocaleString():"—"}),u.jsx("span",{className:"telemetry-lbl",children:"symbols"})]}),u.jsxs("div",{className:"telemetry-pill",title:"Graph dependency edges",children:[u.jsx("span",{className:"telemetry-val text-tertiary",children:k!==void 0?k.toLocaleString():"—"}),u.jsx("span",{className:"telemetry-lbl",children:"edges"})]})]}):u.jsxs("button",{className:"header-btn header-btn-error",onClick:p,disabled:T,title:"Attempt to reconnect to FastAST API server",children:[u.jsx("span",{className:`material-symbols-outlined text-sm ${T?"animate-spin":""}`,children:T?"sync":"sync_problem"}),u.jsx("span",{children:T?"Connecting...":"Retry Connection"})]}),u.jsxs("button",{onClick:d,disabled:v||!g,className:"header-btn header-btn-secondary",title:"Re-run incremental AST indexing on repository",children:[u.jsx("span",{className:`material-symbols-outlined text-sm ${v?"spin-icon":""}`,children:"refresh"}),u.jsx("span",{children:v?"Indexing...":"Re-index"})]}),u.jsxs("button",{onClick:()=>{const q=N.trim()||"retrieve_context";c(q)},className:"header-btn header-btn-primary",title:"Retrieve token-bounded evidence bundle",children:[u.jsx("span",{className:"material-symbols-outlined text-sm",children:"manage_search"}),u.jsx("span",{children:"Evidence Query"})]})]}),u.jsx("style",{children:`
        .app-header {
          height: 52px;
          width: 100%;
          background: var(--surface);
          border-bottom: 1px solid var(--hairline);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 16px;
          z-index: 40;
          flex-shrink: 0;
          gap: 16px;
        }
        .header-left {
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .brand-title {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .brand-icon {
          color: var(--primary);
          font-size: 20px;
        }
        .brand-name {
          font-weight: 700;
          font-size: 14.5px;
          letter-spacing: -0.02em;
          color: var(--on-surface);
        }
        .brand-tag {
          font-family: var(--font-mono);
          font-size: 9.5px;
          font-weight: 700;
          color: var(--primary);
          background: var(--primary-container);
          padding: 2px 5px;
          border-radius: 3px;
          letter-spacing: 0.06em;
        }
        .repo-badge {
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 4px 9px;
          background: var(--surface-low);
          border: 1px solid var(--hairline);
          border-radius: 5px;
        }
        .repo-name {
          font-family: var(--font-mono);
          font-size: 11.5px;
          font-weight: 600;
          color: var(--on-surface);
        }
        .status-pill {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 2px 6px;
          border-radius: 3px;
          font-family: var(--font-mono);
          font-size: 10px;
          font-weight: 600;
        }
        .status-pill-online {
          background: rgba(16, 185, 129, 0.14);
          color: var(--tertiary-light);
        }
        .status-pill-offline {
          background: rgba(244, 63, 94, 0.18);
          color: var(--error-light);
          cursor: pointer;
        }
        .status-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
        }
        .dot-online {
          background: var(--tertiary);
        }
        .dot-offline {
          background: var(--error);
        }
        .header-search-wrap {
          flex: 1;
          max-width: 440px;
          position: relative;
          display: flex;
          align-items: center;
        }
        .header-search-wrap .search-icon {
          position: absolute;
          left: 10px;
          font-size: 16px;
          color: var(--outline);
          pointer-events: none;
        }
        .header-search-input {
          width: 100%;
          height: 32px;
          background: var(--surface-lowest);
          border: 1px solid var(--hairline);
          border-radius: 5px;
          padding: 0 28px 0 32px;
          color: var(--on-surface);
          font-family: var(--font-mono);
          font-size: 12px;
          outline: none;
          transition: border-color 0.15s;
        }
        .header-search-input:focus {
          border-color: var(--primary);
        }
        .header-search-input::placeholder {
          color: var(--outline);
        }
        .search-clear-btn {
          position: absolute;
          right: 6px;
          background: transparent;
          border: none;
          color: var(--outline);
          font-size: 15px;
          cursor: pointer;
          padding: 2px 5px;
        }
        .header-right {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .telemetry-group {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .telemetry-pill {
          display: flex;
          align-items: baseline;
          gap: 4px;
          padding: 4px 8px;
          background: var(--surface-low);
          border: 1px solid var(--hairline);
          border-radius: 4px;
          font-family: var(--font-mono);
          font-size: 11px;
        }
        .telemetry-val {
          font-weight: 700;
          color: var(--on-surface);
        }
        .telemetry-lbl {
          font-size: 10px;
          color: var(--outline);
        }
        .header-btn {
          height: 30px;
          padding: 0 11px;
          border-radius: 5px;
          font-size: 11.5px;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          transition: all 0.15s;
          border: 1px solid transparent;
        }
        .header-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .header-btn-secondary {
          background: var(--surface-container);
          border-color: var(--hairline);
          color: var(--on-surface);
        }
        .header-btn-secondary:hover:not(:disabled) {
          background: var(--surface-high);
          border-color: var(--outline-variant);
        }
        .header-btn-primary {
          background: var(--primary);
          color: var(--on-primary);
        }
        .header-btn-primary:hover {
          opacity: 0.92;
        }
        .header-btn-error {
          background: rgba(244, 63, 94, 0.2);
          border-color: var(--error);
          color: var(--error-light);
        }
      `})]})},jy=({stats:s,health:o,apiError:m})=>{const c=!!(o!=null&&o.ok&&!m),d=(s==null?void 0:s.symbols)??(o==null?void 0:o.symbol_count),p=(s==null?void 0:s.files)??(o==null?void 0:o.file_count),v=s!=null&&s.languages?Object.keys(s.languages).length:void 0,T=s==null?void 0:s.communities_count,N=[{to:"/globe",icon:"hub",label:"2D Code Graph",badge:d!==void 0?String(d):void 0,sub:"Call Graph & Dependencies"},{to:"/explore",icon:"account_tree",label:"Code Explorer",badge:p!==void 0?String(p):void 0,sub:"Files, Outlines & Snippets"},{to:"/evidence",icon:"manage_search",label:"Evidence Bundle",badge:"RRF",sub:"Token-Bounded Retrieval"},{to:"/communities",icon:"bubble_chart",label:"Communities",badge:T!==void 0&&T>0?String(T):void 0,sub:"Louvain Modularity Clusters"},{to:"/coverage",icon:"fact_check",label:"Index Coverage",badge:v!==void 0?`${v} langs`:void 0,sub:"Language & File Breakdown"},{to:"/architecture",icon:"layers",label:"Architecture",sub:"Subsystems & Hotspots"},{to:"/system",icon:"dns",label:"System & Health",badge:c?"OK":"ERR",sub:"API, SQLite WAL & Doctor"}];return u.jsxs("aside",{className:"app-sidebar",children:[u.jsxs("div",{className:"sidebar-section",children:[u.jsx("div",{className:"sidebar-heading",children:"Navigation"}),u.jsx("nav",{className:"sidebar-nav",children:N.map(z=>u.jsxs(kp,{to:z.to,className:({isActive:y})=>`sidebar-link ${y?"sidebar-link-active":""}`,children:[u.jsx("span",{className:"material-symbols-outlined sidebar-icon",children:z.icon}),u.jsxs("div",{className:"sidebar-link-text",children:[u.jsxs("div",{className:"sidebar-link-row",children:[u.jsx("span",{className:"sidebar-label",children:z.label}),z.badge&&u.jsx("span",{className:`sidebar-badge ${z.badge==="ERR"?"sidebar-badge-err":""}`,children:z.badge})]}),u.jsx("span",{className:"sidebar-sub",children:z.sub})]})]},z.to))})]}),u.jsx("div",{className:"sidebar-footer",children:u.jsxs("div",{className:"conn-card",children:[u.jsxs("div",{className:"conn-row",children:[u.jsx("span",{className:`conn-dot ${c?"conn-dot-ok":"conn-dot-err"}`}),u.jsx("span",{className:"conn-title",children:c?"FastAST API Connected":"API Unreachable"})]}),u.jsxs("div",{className:"conn-meta font-code",children:[u.jsx("div",{children:"Endpoint: 127.0.0.1:4200"}),u.jsxs("div",{children:["DB: ",o!=null&&o.db_exists?".fastast.db (WAL)":"Not initialized"]})]})]})}),u.jsx("style",{children:`
        .app-sidebar {
          width: 220px;
          flex-shrink: 0;
          height: calc(100vh - 52px);
          background: var(--surface-low);
          border-right: 1px solid var(--hairline);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 12px 10px;
          z-index: 30;
          user-select: none;
          overflow-y: auto;
          overflow-x: hidden;
        }
        .sidebar-section {
          display: flex;
          flex-direction: column;
          gap: 6px;
          flex: 1;
          min-height: 0;
          overflow-y: auto;
          overflow-x: hidden;
          padding-right: 2px;
          overscroll-behavior: contain;
        }
        .sidebar-heading {
          font-family: var(--font-mono);
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--outline);
          padding: 2px 8px;
        }
        .sidebar-nav {
          display: flex;
          flex-direction: column;
          gap: 3px;
          flex-shrink: 0;
        }
        .sidebar-link {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 10px;
          border-radius: 6px;
          text-decoration: none;
          color: var(--on-surface-variant);
          border: 1px solid transparent;
          transition: all 0.12s ease;
        }
        .sidebar-link:hover {
          background: var(--surface);
          color: var(--on-surface);
        }
        .sidebar-link-active {
          background: var(--surface-container);
          color: var(--on-surface);
          border-color: var(--hairline);
          box-shadow: inset 2px 0 0 0 var(--primary);
        }
        .sidebar-link-active .sidebar-icon {
          color: var(--primary);
        }
        .sidebar-icon {
          font-size: 18px;
          color: var(--outline);
          flex-shrink: 0;
        }
        .sidebar-link-text {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 1px;
        }
        .sidebar-link-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 4px;
        }
        .sidebar-label {
          font-size: 12.5px;
          font-weight: 600;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .sidebar-badge {
          font-family: var(--font-mono);
          font-size: 9.5px;
          padding: 1px 5px;
          border-radius: 3px;
          background: var(--surface-high);
          color: var(--on-surface-variant);
          font-weight: 600;
        }
        .sidebar-badge-err {
          background: rgba(244, 63, 94, 0.2);
          color: var(--error-light);
        }
        .sidebar-sub {
          font-size: 10.5px;
          color: var(--outline);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .sidebar-footer {
          padding-top: 10px;
          border-top: 1px solid var(--hairline);
          margin-top: auto;
          flex-shrink: 0;
        }
        .conn-card {
          background: var(--surface);
          border: 1px solid var(--hairline);
          border-radius: 6px;
          padding: 9px 10px;
          display: flex;
          flex-direction: column;
          gap: 5px;
        }
        .conn-row {
          display: flex;
          align-items: center;
          gap: 7px;
        }
        .conn-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .conn-dot-ok {
          background: var(--tertiary);
        }
        .conn-dot-err {
          background: var(--error);
        }
        .conn-title {
          font-size: 11.5px;
          font-weight: 600;
          color: var(--on-surface);
        }
        .conn-meta {
          font-size: 10px;
          color: var(--outline);
          line-height: 1.4;
        }

        @media (max-width: 1280px) {
          .app-sidebar {
            width: 196px;
            padding: 8px 7px;
          }
          .sidebar-link {
            padding: 6px 8px;
          }
          .sidebar-sub {
            font-size: 9.5px;
          }
        }

        @media (max-width: 980px) {
          .app-sidebar {
            width: 64px;
            padding: 8px 6px;
          }
          .sidebar-heading,
          .sidebar-link-text,
          .sidebar-footer {
            display: none;
          }
          .sidebar-nav {
            align-items: center;
          }
          .sidebar-link {
            width: 52px;
            height: 44px;
            justify-content: center;
            padding: 0;
          }
          .sidebar-icon {
            font-size: 20px;
          }
        }

        @media (max-height: 620px) {
          .app-sidebar {
            padding-top: 6px;
            padding-bottom: 6px;
          }
          .sidebar-heading {
            display: none;
          }
          .sidebar-nav {
            gap: 1px;
          }
          .sidebar-link {
            padding-top: 5px;
            padding-bottom: 5px;
          }
          .sidebar-sub,
          .conn-meta {
            display: none;
          }
          .sidebar-footer {
            padding-top: 6px;
          }
          .conn-card {
            padding: 7px 8px;
          }
        }
      `})]})},Ey="/api",yp="http://127.0.0.1:4200/api",bp=1e4;class Ts extends Error{constructor(m,c,d){super(m);ro(this,"status");ro(this,"endpoint");this.name="ApiConnectionError",this.endpoint=c,this.status=d}}async function qt(s,o){const m=new AbortController,c=setTimeout(()=>m.abort(),bp);try{let d=null,p=null;try{if(d=await fetch(`${Ey}${s}`,{...o,signal:m.signal}),!d.ok&&(d.status===502||d.status===504||d.status===500))try{const v=await fetch(`${yp}${s}`,{...o,signal:m.signal});v.ok&&(d=v)}catch{}}catch(v){p=v;try{d=await fetch(`${yp}${s}`,{...o,signal:m.signal})}catch{throw p}}if(!d||!d.ok){const v=d==null?void 0:d.status;let T=v?`HTTP ${v} on ${s}`:`Failed request on ${s}`;try{const N=await(d==null?void 0:d.json());N!=null&&N.error&&(T=N.error)}catch{}throw new Ts(T,s,v)}return await d.json()}catch(d){throw d instanceof Ts?d:(d==null?void 0:d.name)==="AbortError"?new Ts(`Request timed out after ${bp/1e3}s (${s}). Ensure FastAST API server is running on port 4200.`,s):new Ts(`Cannot reach FastAST API server at http://127.0.0.1:4200 (${s}). Start it with "fastast serve" or "./start_ui.sh".`,s)}finally{clearTimeout(c)}}const $e={async getHealth(){return await qt("/health")},async getStats(){return await qt("/stats")},async getFiles(){return(await qt("/files")).files||[]},async searchSymbols(s,o,m,c=60){const d=new URLSearchParams({q:s,limit:String(c)});return o&&o!=="all"&&d.set("kind",o),m&&m!=="all"&&d.set("language",m),(await qt(`/symbols?${d}`)).symbols||[]},async getOutline(s){const o=new URLSearchParams({file:s});return(await qt(`/outline?${o}`)).outline||[]},async getSnippet(s,o,m,c){const d=new URLSearchParams;return s&&d.set("symbol",s),o&&d.set("file",o),m!==void 0&&d.set("start",String(m)),c!==void 0&&d.set("end",String(c)),await qt(`/snippet?${d}`)},async getCallGraph(s){const o=new URLSearchParams({symbol:s});return await qt(`/calls?${o}`)},async getGraphNeighborhood(s,o=2){const m=new URLSearchParams({symbol:s,depth:String(o)});return await qt(`/graph?${m}`)},async getEvidence(s,o=1500,m="hybrid"){const c=new URLSearchParams({q:s,max_tokens:String(o),ranking:m});return await qt(`/evidence?${c}`)},async getCommunities(s=25){return(await qt(`/communities?limit=${s}`)).communities||[]},async getSimilarSymbols(s,o=10){const m=new URLSearchParams({symbol:s,limit:String(o)});return(await qt(`/similar?${m}`)).similar||[]},async getGlobeTopology(s){const o=new URLSearchParams;return o.set("mode",(s==null?void 0:s.mode)||"full"),s!=null&&s.symbol&&o.set("symbol",s.symbol),o.set("depth",String((s==null?void 0:s.depth)??2)),o.set("max_nodes",String((s==null?void 0:s.maxNodes)??240)),o.set("max_edges",String((s==null?void 0:s.maxEdges)??800)),await qt(`/globe?${o}`)},async getDiagnostics(){return await qt("/diagnose")},async triggerReindex(s=!1){return await qt("/index",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({force:s})})}},Ty=()=>{const s=ja(),[o,m]=b.useState(null),[c,d]=b.useState([]),[p,v]=b.useState([]),[T,N]=b.useState(null);b.useEffect(()=>{Promise.all([$e.getStats(),$e.getCommunities(12),$e.getGlobeTopology({mode:"neighborhood",depth:1})]).then(([y,g,A])=>{m(y),d(g),v(A.hub_symbols||[])}).catch(y=>{N((y==null?void 0:y.message)||"Failed to load live architecture data.")})},[]);const z=[{num:"01",title:"Discovery & Admission",module:"python/fastast/discovery.py",desc:"Multi-layer ignore filtering (.gitignore, .fastastignore) and SHA-256 content hashing."},{num:"02",title:"Rust Tree-Sitter AST Core",module:"src/lib.rs",desc:"Compiled Rust Tree-Sitter parsers extracting symbols, signatures, imports, and calls across 9 languages."},{num:"03",title:"SQLite WAL Graph Store",module:"python/fastast/db.py",desc:"Persistent relational graph (.fastast.db) storing files, symbols, calls, edges, and FTS5 postings."},{num:"04",title:"Hybrid Retrieval & Evidence",module:"python/fastast/retrieval.py",desc:"Combines BM25 lexical search, dense embeddings, and graph degree centrality into token-bounded snippets."},{num:"05",title:"Louvain & MinHash LSH",module:"python/fastast/communities.py",desc:"Detects modular subsystems via Louvain community detection and near-duplicate symbols via MinHash LSH."},{num:"06",title:"CLI, MCP & HTTP Bridge",module:"python/fastast/api_server.py",desc:"Exposes identical codebase memory tools over CLI, stdio MCP JSON-RPC, and HTTP REST API (:4200)."}];return u.jsxs("div",{className:"arch-page",children:[u.jsxs("div",{className:"arch-header",children:[u.jsxs("div",{children:[u.jsx("h1",{className:"arch-title",children:"Repository Architecture & Hotspots"}),u.jsx("p",{className:"arch-subtitle",children:"Live architectural subsystems, central hub symbols, and FastAST pipeline map"})]}),o&&u.jsxs("div",{className:"arch-metrics font-code",children:[u.jsxs("span",{className:"metric-chip",children:[u.jsx("strong",{children:o.files})," files"]}),u.jsxs("span",{className:"metric-chip",children:[u.jsx("strong",{className:"text-primary",children:o.symbols})," symbols"]}),u.jsxs("span",{className:"metric-chip",children:[u.jsx("strong",{className:"text-tertiary",children:o.edges})," edges"]})]})]}),u.jsxs("div",{className:"arch-scroll",children:[T&&u.jsx("div",{className:"api-error-banner",children:u.jsx("div",{children:T})}),u.jsxs("div",{className:"arch-two-col",children:[u.jsxs("div",{className:"arch-panel",children:[u.jsxs("div",{className:"panel-hdr font-code",children:[u.jsx("span",{children:"Top Central Hub Symbols (Live Graph Degree)"}),u.jsxs("span",{className:"text-primary",children:[p.length," hubs"]})]}),u.jsx("div",{className:"hubs-table-wrap font-code",children:p.length>0?u.jsxs("table",{className:"arch-table",children:[u.jsx("thead",{children:u.jsxs("tr",{children:[u.jsx("th",{children:"Symbol"}),u.jsx("th",{children:"Kind"}),u.jsx("th",{children:"Module Path"}),u.jsx("th",{children:"Degree"})]})}),u.jsx("tbody",{children:p.slice(0,10).map(y=>u.jsxs("tr",{onClick:()=>s(`/explore?file=${encodeURIComponent(y.file_path)}&symbol=${encodeURIComponent(y.name)}`),children:[u.jsx("td",{className:"text-primary font-semibold",children:y.name}),u.jsx("td",{children:u.jsx("span",{className:"kind-pill",children:y.kind})}),u.jsx("td",{className:"text-outline",children:y.file_path}),u.jsx("td",{className:"text-tertiary font-bold",children:y.degree})]},y.id))})]}):u.jsx("div",{className:"p-4 text-outline text-xs",children:"Loading hub symbols..."})})]}),u.jsxs("div",{className:"arch-panel",children:[u.jsxs("div",{className:"panel-hdr font-code",children:[u.jsx("span",{children:"Detected Architectural Subsystems (Louvain)"}),u.jsxs("span",{className:"text-secondary",children:[c.length," clusters"]})]}),u.jsx("div",{className:"subsystems-list font-code",children:c.slice(0,8).map(y=>u.jsxs("div",{className:"subsystem-row",onClick:()=>s("/communities"),children:[u.jsxs("div",{className:"flex items-center gap-2 min-w-0",children:[u.jsx("span",{className:"sub-dot",style:{backgroundColor:y.color}}),u.jsx("span",{className:"font-semibold text-on-surface truncate",children:y.name})]}),u.jsxs("span",{className:"text-outline text-xs",children:[y.member_count," symbols • Q=",y.modularity]})]},y.id))})]})]}),u.jsxs("div",{className:"arch-panel",children:[u.jsx("div",{className:"panel-hdr font-code",children:u.jsx("span",{children:"FastAST Engine Pipeline Modules (Click any module to open in Explore)"})}),u.jsx("div",{className:"stages-grid",children:z.map(y=>u.jsxs("div",{className:"stage-card",onClick:()=>s(`/explore?file=${encodeURIComponent(y.module)}`),children:[u.jsxs("div",{className:"stage-top font-code",children:[u.jsx("span",{className:"stage-num",children:y.num}),u.jsx("span",{className:"stage-mod",children:y.module})]}),u.jsx("div",{className:"stage-title",children:y.title}),u.jsx("p",{className:"stage-desc",children:y.desc})]},y.num))})]})]}),u.jsx("style",{children:`
        .arch-page {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          background: var(--surface-lowest);
          overflow: hidden;
        }
        .arch-header {
          padding: 14px 20px;
          background: var(--surface);
          border-bottom: 1px solid var(--hairline);
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-shrink: 0;
        }
        .arch-title {
          font-size: 15px;
          font-weight: 700;
          color: var(--on-surface);
          margin: 0;
        }
        .arch-subtitle {
          font-size: 12px;
          color: var(--outline);
          margin: 2px 0 0 0;
        }
        .arch-metrics {
          display: flex;
          gap: 8px;
        }
        .metric-chip {
          background: var(--surface-low);
          border: 1px solid var(--hairline);
          padding: 4px 10px;
          border-radius: 4px;
          font-size: 11.5px;
          color: var(--on-surface-variant);
        }
        .arch-scroll {
          flex: 1;
          overflow-y: auto;
          padding: 18px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          max-width: 1360px;
          width: 100%;
          margin: 0 auto;
        }
        .arch-two-col {
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          gap: 16px;
        }
        .arch-panel {
          background: var(--surface);
          border: 1px solid var(--hairline);
          border-radius: 6px;
          padding: 14px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .panel-hdr {
          display: flex;
          justify-content: space-between;
          font-size: 10.5px;
          text-transform: uppercase;
          color: var(--outline);
          font-weight: 700;
        }
        .hubs-table-wrap {
          overflow-x: auto;
        }
        .arch-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 11.5px;
        }
        .arch-table th {
          text-align: left;
          padding: 6px 8px;
          border-bottom: 1px solid var(--hairline);
          color: var(--outline);
          font-size: 10px;
          text-transform: uppercase;
        }
        .arch-table td {
          padding: 6px 8px;
          border-bottom: 1px solid var(--hairline);
          cursor: pointer;
        }
        .arch-table tr:hover td {
          background: var(--surface-low);
        }
        .kind-pill {
          background: var(--surface-high);
          color: var(--on-surface-variant);
          padding: 1px 5px;
          border-radius: 3px;
          font-size: 9.5px;
          text-transform: uppercase;
        }
        .subsystems-list {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .subsystem-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          padding: 8px 10px;
          background: var(--surface-low);
          border: 1px solid var(--hairline);
          border-radius: 5px;
          font-size: 12px;
          cursor: pointer;
        }
        .subsystem-row:hover {
          border-color: var(--primary);
        }
        .sub-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .stages-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 12px;
        }
        .stage-card {
          background: var(--surface-low);
          border: 1px solid var(--hairline);
          border-radius: 6px;
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          cursor: pointer;
        }
        .stage-card:hover {
          border-color: var(--primary);
          background: var(--surface-container);
        }
        .stage-top {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
        }
        .stage-num {
          color: var(--primary);
          font-weight: 700;
        }
        .stage-mod {
          color: var(--outline);
        }
        .stage-title {
          font-size: 13.5px;
          font-weight: 700;
          color: var(--on-surface);
        }
        .stage-desc {
          margin: 0;
          font-size: 11.5px;
          color: var(--on-surface-variant);
          line-height: 1.45;
        }
      `})]})},Cy=()=>{var A,B;const s=ja(),[o,m]=b.useState([]),[c,d]=b.useState(null),[p,v]=b.useState(!0),[T,N]=b.useState(null),z=async()=>{v(!0),N(null);try{const U=await $e.getCommunities(30);m(U),U.length>0?d(U[0]):d(null)}catch(U){N((U==null?void 0:U.message)||"Failed to load communities from /api/communities.")}finally{v(!1)}};b.useEffect(()=>{z()},[]);const y=(U,k)=>{const q=new URLSearchParams;U&&q.set("file",U),k&&q.set("symbol",k),s(`/explore?${q.toString()}`)},g=U=>{s(U?`/globe?symbol=${encodeURIComponent(U)}`:"/globe")};return u.jsxs("div",{className:"comm-page",children:[u.jsxs("div",{className:"comm-header",children:[u.jsxs("div",{children:[u.jsx("h1",{className:"comm-title",children:"Louvain Modularity Communities"}),u.jsx("p",{className:"comm-subtitle",children:"Structural graph clusters detected from call, import, and definition edges"})]}),u.jsxs("div",{className:"comm-meta-badge font-code",children:[u.jsx("span",{className:"material-symbols-outlined text-sm text-tertiary",children:"bubble_chart"}),u.jsxs("span",{children:[o.length," Communities Loaded"]})]})]}),T&&u.jsx("div",{className:"p-4",children:u.jsxs("div",{className:"api-error-banner",children:[u.jsx("div",{children:T}),u.jsx("button",{className:"api-retry-btn",onClick:z,children:"Retry"})]})}),u.jsxs("div",{className:"comm-body",children:[u.jsx("div",{className:"comm-list-col",children:p?u.jsx("div",{className:"p-6 text-center text-outline font-code",children:"Loading communities from SQLite..."}):o.length>0?o.map(U=>{const k=(c==null?void 0:c.id)===U.id;return u.jsxs("div",{className:`comm-card ${k?"comm-card-selected":""}`,onClick:()=>d(U),children:[u.jsxs("div",{className:"comm-card-top",children:[u.jsxs("div",{className:"comm-name-wrap",children:[u.jsx("span",{className:"comm-dot",style:{backgroundColor:U.color}}),u.jsx("span",{className:"comm-card-name truncate",children:U.name})]}),u.jsxs("span",{className:"comm-card-count font-code",children:[U.member_count," symbols"]})]}),U.sample_symbols&&U.sample_symbols.length>0&&u.jsxs("div",{className:"comm-card-samples font-code",children:[u.jsx("span",{className:"text-outline",children:"Hubs: "}),u.jsx("span",{className:"text-on-surface-variant",children:U.sample_symbols.slice(0,4).join(", ")})]})]},U.id)}):u.jsx("div",{className:"p-6 text-center text-outline font-code",children:"No communities found in index. Run Re-index to compute Louvain clusters."})}),u.jsx("div",{className:"comm-detail-col",children:c?u.jsxs("div",{className:"comm-detail-card",children:[u.jsxs("div",{className:"detail-header",children:[u.jsxs("div",{className:"detail-title-group",children:[u.jsx("span",{className:"detail-dot",style:{backgroundColor:c.color}}),u.jsxs("div",{children:[u.jsx("h2",{className:"detail-title",children:c.name}),u.jsxs("span",{className:"font-code text-xs text-outline",children:["Community #",c.id," • Modularity Q = ",c.modularity," •"," ",c.member_count," symbols"]})]})]}),u.jsxs("div",{className:"detail-actions",children:[u.jsxs("button",{className:"btn-primary-sm",onClick:()=>{var U,k,q;return g(((k=(U=c.members)==null?void 0:U[0])==null?void 0:k.name)||((q=c.sample_symbols)==null?void 0:q[0]))},children:[u.jsx("span",{className:"material-symbols-outlined text-xs",children:"public"}),u.jsx("span",{children:"Focus Hub in Globe"})]}),u.jsxs("button",{className:"btn-secondary-sm",onClick:()=>{var U,k;return y((U=c.sample_files)==null?void 0:U[0],(k=c.sample_symbols)==null?void 0:k[0])},children:[u.jsx("span",{className:"material-symbols-outlined text-xs",children:"account_tree"}),u.jsx("span",{children:"Open in Explore"})]})]})]}),u.jsxs("div",{className:"detail-section",children:[u.jsxs("span",{className:"section-label",children:["Contributing Files (",((A=c.sample_files)==null?void 0:A.length)||0,") — Click to Explore"]}),u.jsx("div",{className:"pills-wrap font-code",children:c.sample_files&&c.sample_files.length>0?c.sample_files.map((U,k)=>u.jsxs("button",{className:"file-pill",onClick:()=>y(U),children:[u.jsx("span",{className:"material-symbols-outlined text-xs text-primary",children:"description"}),u.jsx("span",{children:U})]},k)):u.jsx("span",{className:"text-outline text-xs",children:"No files listed"})})]}),u.jsxs("div",{className:"detail-section",children:[u.jsxs("span",{className:"section-label",children:["Community Member Symbols (",((B=c.members)==null?void 0:B.length)||c.sample_symbols.length,")"]}),c.members&&c.members.length>0?u.jsx("div",{className:"members-table-wrap font-code",children:u.jsxs("table",{className:"members-table",children:[u.jsx("thead",{children:u.jsxs("tr",{children:[u.jsx("th",{children:"Kind"}),u.jsx("th",{children:"Symbol"}),u.jsx("th",{children:"File"}),u.jsx("th",{children:"Lines"}),u.jsx("th",{children:"Actions"})]})}),u.jsx("tbody",{children:c.members.map(U=>u.jsxs("tr",{children:[u.jsx("td",{children:u.jsx("span",{className:"kind-chip",children:U.kind})}),u.jsx("td",{className:"text-primary font-semibold",children:U.name}),u.jsx("td",{className:"text-outline",children:U.file_path}),u.jsxs("td",{className:"text-outline",children:["L",U.start_line,"–",U.end_line]}),u.jsx("td",{children:u.jsxs("div",{className:"row-btns",children:[u.jsx("button",{className:"row-btn",onClick:()=>y(U.file_path,U.name),children:"Explore"}),u.jsx("button",{className:"row-btn",onClick:()=>g(U.name),children:"Globe"})]})})]},U.id))})]})}):u.jsx("div",{className:"pills-wrap font-code",children:c.sample_symbols.map((U,k)=>u.jsx("button",{className:"file-pill",onClick:()=>g(U),children:u.jsx("span",{className:"text-primary",children:U})},k))})]})]}):u.jsx("div",{className:"comm-empty font-code",children:"Select a community from the left list to inspect its member symbols and files."})})]}),u.jsx("style",{children:`
        .comm-page {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          background: var(--surface-lowest);
          overflow: hidden;
        }
        .comm-header {
          padding: 14px 20px;
          background: var(--surface);
          border-bottom: 1px solid var(--hairline);
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-shrink: 0;
        }
        .comm-title {
          font-size: 15px;
          font-weight: 700;
          color: var(--on-surface);
          margin: 0;
        }
        .comm-subtitle {
          font-size: 12px;
          color: var(--outline);
          margin: 2px 0 0 0;
        }
        .comm-meta-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          background: var(--surface-low);
          padding: 5px 10px;
          border-radius: 4px;
          border: 1px solid var(--hairline);
          font-size: 11.5px;
          color: var(--on-surface);
        }
        .comm-body {
          flex: 1;
          display: grid;
          grid-template-columns: 380px 1fr;
          overflow: hidden;
        }
        .comm-list-col {
          height: 100%;
          overflow-y: auto;
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          border-right: 1px solid var(--hairline);
          background: var(--surface-low);
        }
        .comm-card {
          background: var(--surface);
          border: 1px solid var(--hairline);
          border-radius: 6px;
          padding: 10px 12px;
          display: flex;
          flex-direction: column;
          gap: 5px;
          cursor: pointer;
        }
        .comm-card:hover {
          background: var(--surface-container);
        }
        .comm-card-selected {
          border-color: var(--primary);
          background: var(--surface-container);
          box-shadow: inset 2px 0 0 0 var(--primary);
        }
        .comm-card-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }
        .comm-name-wrap {
          display: flex;
          align-items: center;
          gap: 8px;
          min-width: 0;
        }
        .comm-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .comm-card-name {
          font-size: 12.5px;
          font-weight: 600;
          color: var(--on-surface);
        }
        .comm-card-count {
          font-size: 10.5px;
          color: var(--outline);
          flex-shrink: 0;
        }
        .comm-card-samples {
          font-size: 11px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .comm-detail-col {
          height: 100%;
          overflow-y: auto;
          padding: 18px;
        }
        .comm-detail-card {
          background: var(--surface);
          border: 1px solid var(--hairline);
          border-radius: 6px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .detail-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding-bottom: 12px;
          border-bottom: 1px solid var(--hairline);
          flex-wrap: wrap;
        }
        .detail-title-group {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .detail-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
        }
        .detail-title {
          font-size: 15px;
          font-weight: 700;
          margin: 0;
          color: var(--on-surface);
        }
        .detail-actions {
          display: flex;
          gap: 8px;
        }
        .btn-primary-sm, .btn-secondary-sm {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 5px 10px;
          border-radius: 4px;
          font-size: 11.5px;
          font-weight: 600;
          cursor: pointer;
          border: 1px solid var(--hairline);
        }
        .btn-primary-sm {
          background: var(--primary);
          color: var(--on-primary);
          border-color: transparent;
        }
        .btn-secondary-sm {
          background: var(--surface-container);
          color: var(--on-surface);
        }
        .detail-section {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .section-label {
          font-family: var(--font-mono);
          font-size: 10.5px;
          text-transform: uppercase;
          color: var(--outline);
          font-weight: 600;
        }
        .pills-wrap {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }
        .file-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 5px 9px;
          background: var(--surface-low);
          border: 1px solid var(--hairline);
          border-radius: 4px;
          color: var(--on-surface);
          font-family: var(--font-mono);
          font-size: 11.5px;
          cursor: pointer;
        }
        .file-pill:hover {
          border-color: var(--primary);
          color: var(--primary);
        }
        .members-table-wrap {
          overflow-x: auto;
          border: 1px solid var(--hairline);
          border-radius: 5px;
        }
        .members-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 11.5px;
        }
        .members-table th {
          text-align: left;
          padding: 7px 10px;
          background: var(--surface-low);
          border-bottom: 1px solid var(--hairline);
          color: var(--outline);
          font-size: 10px;
          text-transform: uppercase;
        }
        .members-table td {
          padding: 7px 10px;
          border-bottom: 1px solid var(--hairline);
        }
        .kind-chip {
          background: var(--surface-high);
          color: var(--on-surface-variant);
          padding: 1px 5px;
          border-radius: 3px;
          font-size: 9.5px;
          text-transform: uppercase;
        }
        .row-btns {
          display: flex;
          gap: 4px;
        }
        .row-btn {
          background: var(--surface-container);
          border: 1px solid var(--hairline);
          color: var(--on-surface);
          font-family: var(--font-mono);
          font-size: 10px;
          padding: 2px 6px;
          border-radius: 3px;
          cursor: pointer;
        }
        .row-btn:hover {
          border-color: var(--primary);
          color: var(--primary);
        }
        .comm-empty {
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--outline);
          font-size: 12px;
        }
      `})]})},zy=()=>{var le;const[s,o]=b.useState(null),[m,c]=b.useState(null),[d,p]=b.useState([]),[v,T]=b.useState(!0),[N,z]=b.useState(null),y=async()=>{T(!0),z(null);try{const[F,J,xe]=await Promise.all([$e.getStats(),$e.getDiagnostics(),$e.getFiles()]);o(F),c(J),p(xe)}catch(F){z((F==null?void 0:F.message)||"Failed to load index coverage data.")}finally{T(!1)}};b.useEffect(()=>{y()},[]);const g={python:"#38bdf8",rust:"#f97316",typescript:"#3b82f6",javascript:"#eab308",markdown:"#94a3b8",json:"#fbbf24",html:"#f43f5e",css:"#06b6d4",toml:"#a855f7",java:"#ef4444"},A=(s==null?void 0:s.files)??0,B=((le=m==null?void 0:m.coverage)==null?void 0:le.disk_files_count)??A,U=d.filter(F=>F.has_syntax_error).length,k=Math.max(0,B-A),q=Cs.useMemo(()=>s!=null&&s.languages?Object.entries(s.languages).sort((F,J)=>J[1]-F[1]).map(([F,J])=>({name:F.charAt(0).toUpperCase()+F.slice(1),key:F,count:J,color:g[F.toLowerCase()]||"#a855f7"})):[],[s]),Y=Cs.useMemo(()=>s!=null&&s.categories?Object.entries(s.categories).sort((F,J)=>J[1]-F[1]):[],[s]),ee=Cs.useMemo(()=>s!=null&&s.symbol_kinds?Object.entries(s.symbol_kinds).sort((F,J)=>J[1]-F[1]):[],[s]);return u.jsxs("div",{className:"coverage-page",children:[u.jsxs("div",{className:"coverage-header",children:[u.jsxs("div",{children:[u.jsx("h1",{className:"coverage-title",children:"Repository Index Coverage"}),u.jsx("p",{className:"coverage-subtitle",children:"Live file admission, language distribution, symbol kinds, and parse health from .fastast.db"})]}),u.jsxs("button",{className:"refresh-btn font-code",onClick:y,disabled:v,children:[u.jsx("span",{className:`material-symbols-outlined text-xs ${v?"spin-icon":""}`,children:"refresh"}),u.jsx("span",{children:"Refresh"})]})]}),u.jsxs("div",{className:"coverage-body",children:[N&&u.jsxs("div",{className:"api-error-banner",children:[u.jsx("div",{children:N}),u.jsx("button",{className:"api-retry-btn",onClick:y,children:"Retry"})]}),u.jsxs("div",{className:"summary-cards-row",children:[u.jsxs("div",{className:"summary-card",children:[u.jsx("span",{className:"card-label",children:"Admitted & Indexed Files"}),u.jsx("span",{className:"card-val font-code text-primary",children:A.toLocaleString()}),u.jsxs("span",{className:"card-sub font-code",children:[B," on disk • ",k," pending • ",U," syntax errors"]})]}),u.jsxs("div",{className:"summary-card",children:[u.jsx("span",{className:"card-label",children:"Extracted AST Symbols"}),u.jsx("span",{className:"card-val font-code text-secondary",children:((s==null?void 0:s.symbols)??0).toLocaleString()}),u.jsx("span",{className:"card-sub font-code",children:ee.slice(0,3).map(([F,J])=>`${J} ${F}s`).join(", ")||"No symbols"})]}),u.jsxs("div",{className:"summary-card",children:[u.jsx("span",{className:"card-label",children:"Graph Relationships"}),u.jsx("span",{className:"card-val font-code text-tertiary",children:((s==null?void 0:s.edges)??0).toLocaleString()}),u.jsxs("span",{className:"card-sub font-code",children:[((s==null?void 0:s.calls)??0).toLocaleString()," calls • ",((s==null?void 0:s.imports)??0).toLocaleString()," ","imports"]})]}),u.jsxs("div",{className:"summary-card",children:[u.jsx("span",{className:"card-label",children:"File Categories"}),u.jsx("div",{className:"cat-chips font-code",children:Y.map(([F,J])=>u.jsxs("span",{className:"cat-chip",children:[u.jsx("strong",{children:J})," ",F]},F))}),u.jsxs("span",{className:"card-sub font-code",children:[q.length," active languages"]})]})]}),u.jsxs("div",{className:"section-card",children:[u.jsxs("span",{className:"table-title font-code",children:["Indexed Language Distribution (",q.length," Languages)"]}),q.length>0?u.jsx("div",{className:"languages-grid",children:q.map(F=>{const J=A>0?Math.round(F.count/A*1e3)/10:0;return u.jsxs("div",{className:"lang-box",children:[u.jsxs("div",{className:"lang-box-top",children:[u.jsxs("div",{className:"flex items-center gap-2",children:[u.jsx("span",{className:"lang-dot",style:{backgroundColor:F.color}}),u.jsx("span",{className:"font-semibold",children:F.name})]}),u.jsxs("span",{className:"font-code text-xs text-outline",children:[F.count," files"]})]}),u.jsx("div",{className:"lang-meter",children:u.jsx("div",{className:"lang-meter-bar",style:{width:`${Math.max(2,J)}%`,backgroundColor:F.color}})}),u.jsx("div",{className:"lang-box-bottom font-code text-xs",children:u.jsxs("span",{className:"text-on-surface-variant",children:[J,"% of indexed files"]})})]},F.key)})}):u.jsx("div",{className:"p-6 text-outline font-code text-center",children:v?"Loading language metrics...":"No indexed files found."})]}),ee.length>0&&u.jsxs("div",{className:"section-card",children:[u.jsx("span",{className:"table-title font-code",children:"AST Symbol Kinds Breakdown"}),u.jsx("div",{className:"kinds-grid font-code",children:ee.map(([F,J])=>u.jsxs("div",{className:"kind-stat-box",children:[u.jsx("span",{className:"text-outline uppercase text-xs",children:F}),u.jsx("strong",{className:"text-lg text-on-surface",children:J.toLocaleString()})]},F))})]})]}),u.jsx("style",{children:`
        .coverage-page {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          background: var(--surface-lowest);
          overflow-y: auto;
        }
        .coverage-header {
          padding: 14px 20px;
          background: var(--surface);
          border-bottom: 1px solid var(--hairline);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .coverage-title {
          font-size: 15px;
          font-weight: 700;
          color: var(--on-surface);
          margin: 0;
        }
        .coverage-subtitle {
          font-size: 12px;
          color: var(--outline);
          margin: 2px 0 0 0;
        }
        .refresh-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          background: var(--surface-container);
          border: 1px solid var(--hairline);
          border-radius: 5px;
          color: var(--on-surface);
          font-size: 11.5px;
          cursor: pointer;
        }
        .coverage-body {
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          max-width: 1320px;
          width: 100%;
          margin: 0 auto;
        }
        .summary-cards-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 12px;
        }
        .summary-card {
          background: var(--surface);
          border: 1px solid var(--hairline);
          border-radius: 6px;
          padding: 14px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .card-label {
          font-family: var(--font-mono);
          font-size: 10px;
          color: var(--outline);
          text-transform: uppercase;
        }
        .card-val {
          font-size: 22px;
          font-weight: 700;
        }
        .card-sub {
          font-size: 11px;
          color: var(--outline);
        }
        .cat-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin: 2px 0;
        }
        .cat-chip {
          background: var(--surface-low);
          border: 1px solid var(--hairline);
          padding: 2px 7px;
          border-radius: 4px;
          font-size: 11.5px;
          color: var(--on-surface-variant);
        }
        .section-card {
          background: var(--surface);
          border: 1px solid var(--hairline);
          border-radius: 6px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .table-title {
          font-size: 11px;
          color: var(--outline);
          text-transform: uppercase;
          font-weight: 600;
        }
        .languages-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 12px;
        }
        .lang-box {
          background: var(--surface-low);
          border: 1px solid var(--hairline);
          border-radius: 5px;
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .lang-box-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .lang-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }
        .lang-meter {
          width: 100%;
          height: 5px;
          background: var(--surface-lowest);
          border-radius: 3px;
          overflow: hidden;
        }
        .lang-meter-bar {
          height: 100%;
          border-radius: 3px;
        }
        .lang-box-bottom {
          display: flex;
          justify-content: space-between;
        }
        .kinds-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
          gap: 10px;
        }
        .kind-stat-box {
          background: var(--surface-low);
          border: 1px solid var(--hairline);
          border-radius: 5px;
          padding: 10px 12px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
      `})]})},Ay=()=>{const s=ja(),[o,m]=Xp(),c=o.get("q")||"",[d,p]=b.useState(c||"retrieve_context"),[v,T]=b.useState(2048),[N,z]=b.useState("hybrid"),[y,g]=b.useState(null),[A,B]=b.useState(null),[U,k]=b.useState(!1),[q,Y]=b.useState(null),[ee,le]=b.useState(!1),F=b.useCallback(async(Z,Be=v,Ne=N)=>{if(!Z.trim()){g({query:"",ranking_method:Ne,total_tokens_estimate:0,max_tokens:Be,candidates:[],snippets:[]}),B(null);return}k(!0),Y(null);try{const Ee=await $e.getEvidence(Z.trim(),Be,Ne);g(Ee),Ee.candidates&&Ee.candidates.length>0?B(Ee.candidates[0]):B(null)}catch(Ee){Y((Ee==null?void 0:Ee.message)||"Failed to retrieve evidence bundle."),g(null)}finally{k(!1)}},[v,N]);b.useEffect(()=>{const Z=c||d;c&&c!==d&&p(c),F(Z,v,N)},[c,v,N]);const J=()=>{m(d.trim()?{q:d.trim()}:{}),F(d,v,N)},xe=()=>{y&&(navigator.clipboard.writeText(JSON.stringify(y,null,2)),le(!0),setTimeout(()=>le(!1),2e3))},I=(y==null?void 0:y.total_tokens_estimate)??0,ie=Math.min(100,Math.round(I/v*100)),He=Cs.useMemo(()=>{if(!(y!=null&&y.snippets))return[];if(!A)return y.snippets;const Z=y.snippets.filter(Ne=>Ne.symbol_name===A.name),Be=y.snippets.filter(Ne=>Ne.symbol_name!==A.name);return[...Z,...Be]},[y,A]);return u.jsxs("div",{className:"evidence-page",children:[u.jsxs("div",{className:"evidence-header",children:[u.jsxs("div",{className:"search-row",children:[u.jsxs("div",{className:"search-input-group",children:[u.jsx("span",{className:"material-symbols-outlined search-icon",children:"manage_search"}),u.jsx("input",{type:"text",value:d,onChange:Z=>p(Z.target.value),onKeyDown:Z=>Z.key==="Enter"&&J(),placeholder:"Query symbol name or concept (e.g. 'index_repository', 'Louvain community detection')...",className:"evidence-search-input font-code"}),d&&u.jsx("button",{className:"clear-btn",onClick:()=>{p(""),F("",v,N)},children:"×"})]}),u.jsxs("button",{className:"btn-retrieve",onClick:J,disabled:U,children:[u.jsx("span",{className:`material-symbols-outlined text-sm ${U?"spin-icon":""}`,children:U?"sync":"bolt"}),u.jsx("span",{children:U?"Retrieving...":"Retrieve Evidence"})]})]}),u.jsxs("div",{className:"controls-row",children:[u.jsxs("div",{className:"ranking-selector",children:[u.jsx("span",{className:"ctrl-label",children:"Ranking:"}),["hybrid","rrf","bm25","semantic","heuristic"].map(Z=>u.jsx("button",{className:`mode-btn ${N===Z?"mode-btn-active":""}`,onClick:()=>z(Z),children:Z.toUpperCase()},Z))]}),u.jsxs("div",{className:"token-meter-wrap",children:[u.jsx("span",{className:"ctrl-label",children:"Token Budget:"}),u.jsxs("select",{value:v,onChange:Z=>T(Number(Z.target.value)),className:"budget-select font-code",children:[u.jsx("option",{value:1024,children:"1,024 tokens"}),u.jsx("option",{value:2048,children:"2,048 tokens"}),u.jsx("option",{value:4096,children:"4,096 tokens"})]}),u.jsx("div",{className:"token-meter-bar",children:u.jsx("div",{className:"token-meter-fill",style:{width:`${ie}%`}})}),u.jsxs("span",{className:"token-meter-text font-code",children:[I.toLocaleString()," / ",v.toLocaleString()," tok (",ie,"%)"]})]}),u.jsxs("button",{className:"btn-copy-bundle font-code",onClick:xe,disabled:!y||y.candidates.length===0,children:[u.jsx("span",{className:"material-symbols-outlined text-sm",children:"content_copy"}),u.jsx("span",{children:ee?"Copied JSON!":"Copy JSON Bundle"})]})]})]}),u.jsxs("div",{className:"evidence-body",children:[q&&u.jsx("div",{className:"mb-3",children:u.jsxs("div",{className:"api-error-banner",children:[u.jsxs("div",{children:[u.jsx("strong",{children:"Evidence Query Error:"})," ",q]}),u.jsx("button",{className:"api-retry-btn",onClick:J,children:"Retry"})]})}),U?u.jsxs("div",{className:"state-box font-code",children:[u.jsx("span",{className:"material-symbols-outlined spin-icon text-2xl text-primary",children:"sync"}),u.jsx("span",{children:"Ranking symbols and extracting token-bounded AST snippets..."})]}):d.trim()?y&&y.candidates.length===0?u.jsxs("div",{className:"state-box font-code",children:[u.jsx("span",{className:"material-symbols-outlined text-2xl text-outline",children:"search_off"}),u.jsxs("span",{children:['No matching symbols or evidence found for "',y.query,'".']})]}):y?u.jsxs("div",{className:"evidence-grid",children:[u.jsxs("div",{className:"candidates-col",children:[u.jsxs("div",{className:"col-header font-code",children:[u.jsxs("span",{children:["Ranked Candidates (",y.candidates.length,")"]}),u.jsx("span",{className:"text-primary",children:y.ranking_method.toUpperCase()})]}),u.jsx("div",{className:"candidates-scroll",children:y.candidates.map((Z,Be)=>{const Ne=(A==null?void 0:A.name)===Z.name&&(A==null?void 0:A.file_path)===Z.file_path;return u.jsxs("div",{className:`cand-card ${Ne?"cand-card-selected":""}`,onClick:()=>B(Z),children:[u.jsxs("div",{className:"cand-row-top font-code",children:[u.jsxs("span",{className:"cand-rank",children:["#",Be+1]}),u.jsx("span",{className:"cand-kind",children:Z.kind}),u.jsx("span",{className:"cand-name truncate",children:Z.name}),u.jsx("span",{className:"cand-score",children:Z.score.toFixed(3)})]}),u.jsxs("div",{className:"cand-row-file font-code",children:[u.jsx("span",{className:"truncate",children:Z.file_path}),u.jsxs("span",{children:["L",Z.start_line,"–",Z.end_line]})]}),Z.reasons&&Z.reasons.length>0&&u.jsx("div",{className:"reasons-row font-code",children:Z.reasons.slice(0,4).map((Ee,Fe)=>u.jsx("span",{className:"reason-tag",children:Ee},Fe))}),Ne&&u.jsxs("div",{className:"cand-actions",children:[u.jsx("button",{className:"mini-act-btn",onClick:Ee=>{Ee.stopPropagation(),s(`/explore?file=${encodeURIComponent(Z.file_path)}&symbol=${encodeURIComponent(Z.name)}`)},children:"Explore"}),u.jsx("button",{className:"mini-act-btn",onClick:Ee=>{Ee.stopPropagation(),s(`/globe?symbol=${encodeURIComponent(Z.name)}`)},children:"Focus in Globe"})]})]},`${Z.name}-${Z.file_path}-${Be}`)})})]}),u.jsxs("div",{className:"snippets-col",children:[A&&u.jsxs("div",{className:"selected-cand-banner font-code",children:[u.jsxs("div",{className:"sel-banner-top",children:[u.jsxs("div",{children:[u.jsx("span",{className:"text-primary font-bold text-sm",children:A.name})," ",u.jsxs("span",{className:"text-outline text-xs",children:["(",A.file_path,":L",A.start_line,"–",A.end_line,")"]})]}),u.jsxs("span",{className:"text-tertiary text-xs",children:["Score: ",A.score.toFixed(3)]})]}),A.reasons&&A.reasons.length>0&&u.jsxs("div",{className:"sel-banner-sub",children:[u.jsx("span",{className:"text-outline",children:"Ranking Signals: "}),A.reasons.join(" • ")]}),A.neighbors&&A.neighbors.length>0&&u.jsxs("div",{className:"sel-banner-sub",children:[u.jsx("span",{className:"text-outline",children:"Graph Neighbors: "}),A.neighbors.slice(0,6).map(Z=>`${Z.name||Z.symbol} (${Z.relation||"calls"})`).join(", ")]})]}),u.jsxs("div",{className:"col-header font-code",children:[u.jsxs("span",{children:["Bounded Evidence Windows (",He.length,")"]}),u.jsxs("span",{className:"text-tertiary",children:["Total ~",I.toLocaleString()," tokens"]})]}),u.jsx("div",{className:"snippets-scroll",children:He.map((Z,Be)=>{const Ne=(A==null?void 0:A.name)===Z.symbol_name;return u.jsxs("div",{className:`snippet-card ${Ne?"snippet-card-highlighted":""}`,children:[u.jsxs("div",{className:"snippet-header font-code",children:[u.jsxs("div",{className:"snippet-meta",children:[u.jsx("span",{className:"text-primary font-bold",children:Z.symbol_name}),u.jsxs("span",{className:"text-outline text-xs",children:[Z.file_path," [L",Z.start_line,"–",Z.end_line,"]"]})]}),u.jsxs("div",{className:"snippet-right",children:[u.jsxs("span",{className:"token-badge",children:["~",Z.token_count," tok"]}),u.jsx("button",{className:"mini-act-btn",onClick:()=>s(`/explore?file=${encodeURIComponent(Z.file_path)}&symbol=${encodeURIComponent(Z.symbol_name)}`),children:"Open File"})]})]}),Z.reasons&&Z.reasons.length>0&&u.jsxs("div",{className:"snippet-reasons font-code",children:["Signals: ",Z.reasons.join(" · ")]}),u.jsx("pre",{className:"snippet-code font-code",children:Z.snippet})]},`${Z.symbol_name}-${Be}`)})})]})]}):null:u.jsxs("div",{className:"state-box font-code",children:[u.jsx("span",{className:"material-symbols-outlined text-2xl text-outline",children:"search"}),u.jsx("span",{children:"Enter a symbol or natural-language query above to retrieve bounded evidence."})]})]}),u.jsx("style",{children:`
        .evidence-page {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          background: var(--surface-lowest);
          overflow: hidden;
        }
        .evidence-header {
          padding: 12px 18px;
          background: var(--surface);
          border-bottom: 1px solid var(--hairline);
          display: flex;
          flex-direction: column;
          gap: 10px;
          flex-shrink: 0;
        }
        .search-row {
          display: flex;
          gap: 10px;
        }
        .search-input-group {
          flex: 1;
          display: flex;
          align-items: center;
          background: var(--surface-lowest);
          border: 1px solid var(--hairline);
          border-radius: 5px;
          padding: 0 10px;
          height: 36px;
        }
        .search-input-group:focus-within {
          border-color: var(--primary);
        }
        .search-icon {
          color: var(--primary);
          margin-right: 8px;
        }
        .evidence-search-input {
          flex: 1;
          background: transparent;
          border: none;
          color: var(--on-surface);
          font-size: 12.5px;
          outline: none;
        }
        .clear-btn {
          background: transparent;
          border: none;
          color: var(--outline);
          font-size: 16px;
          cursor: pointer;
        }
        .btn-retrieve {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 0 16px;
          height: 36px;
          background: var(--primary);
          color: var(--on-primary);
          border: none;
          border-radius: 5px;
          font-weight: 700;
          font-size: 12px;
          cursor: pointer;
        }
        .btn-retrieve:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .controls-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
        }
        .ctrl-label {
          font-family: var(--font-mono);
          font-size: 10px;
          text-transform: uppercase;
          color: var(--outline);
        }
        .ranking-selector {
          display: flex;
          align-items: center;
          gap: 5px;
        }
        .mode-btn {
          background: var(--surface-low);
          border: 1px solid var(--hairline);
          color: var(--on-surface-variant);
          font-family: var(--font-mono);
          font-size: 10.5px;
          padding: 3px 8px;
          border-radius: 4px;
          cursor: pointer;
        }
        .mode-btn-active {
          background: var(--primary-container);
          border-color: var(--primary);
          color: var(--primary);
          font-weight: 700;
        }
        .token-meter-wrap {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .budget-select {
          background: var(--surface-lowest);
          color: var(--on-surface);
          border: 1px solid var(--hairline);
          border-radius: 4px;
          padding: 3px 8px;
          font-size: 11px;
        }
        .token-meter-bar {
          width: 110px;
          height: 6px;
          background: var(--surface-low);
          border-radius: 3px;
          overflow: hidden;
        }
        .token-meter-fill {
          height: 100%;
          background: var(--tertiary);
          transition: width 0.25s;
        }
        .token-meter-text {
          font-size: 11px;
          color: var(--tertiary-light);
        }
        .btn-copy-bundle {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          background: var(--surface-container);
          border: 1px solid var(--hairline);
          border-radius: 4px;
          color: var(--on-surface);
          font-size: 11px;
          cursor: pointer;
        }
        .btn-copy-bundle:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .evidence-body {
          flex: 1;
          overflow: hidden;
          padding: 14px 18px;
          display: flex;
          flex-direction: column;
        }
        .state-box {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 10px;
          color: var(--outline);
          font-size: 12.5px;
        }
        .evidence-grid {
          flex: 1;
          display: grid;
          grid-template-columns: 370px 1fr;
          gap: 16px;
          min-height: 0;
        }
        .candidates-col, .snippets-col {
          display: flex;
          flex-direction: column;
          gap: 8px;
          min-height: 0;
        }
        .col-header {
          display: flex;
          justify-content: space-between;
          font-size: 10.5px;
          text-transform: uppercase;
          color: var(--outline);
          font-weight: 700;
        }
        .candidates-scroll, .snippets-scroll {
          flex: 1;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding-right: 4px;
        }
        .cand-card {
          background: var(--surface);
          border: 1px solid var(--hairline);
          border-radius: 6px;
          padding: 10px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          cursor: pointer;
        }
        .cand-card:hover {
          background: var(--surface-container);
        }
        .cand-card-selected {
          border-color: var(--primary);
          background: var(--surface-container);
          box-shadow: inset 2px 0 0 0 var(--primary);
        }
        .cand-row-top {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
        }
        .cand-rank {
          color: var(--outline);
          font-size: 10.5px;
        }
        .cand-kind {
          background: var(--surface-high);
          color: var(--on-surface-variant);
          font-size: 9.5px;
          padding: 1px 5px;
          border-radius: 3px;
          text-transform: uppercase;
        }
        .cand-name {
          flex: 1;
          font-weight: 700;
          color: var(--primary);
        }
        .cand-score {
          color: var(--tertiary-light);
          font-size: 11px;
        }
        .cand-row-file {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          color: var(--outline);
        }
        .reasons-row {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
        }
        .reason-tag {
          font-size: 9.5px;
          background: var(--surface-low);
          border: 1px solid var(--hairline);
          color: var(--on-surface-variant);
          padding: 1px 5px;
          border-radius: 3px;
        }
        .cand-actions {
          display: flex;
          gap: 6px;
          padding-top: 4px;
        }
        .mini-act-btn {
          background: var(--surface-high);
          border: 1px solid var(--hairline);
          color: var(--on-surface);
          font-family: var(--font-mono);
          font-size: 10px;
          padding: 2px 7px;
          border-radius: 3px;
          cursor: pointer;
        }
        .mini-act-btn:hover {
          border-color: var(--primary);
          color: var(--primary);
        }

        .selected-cand-banner {
          background: var(--surface);
          border: 1px solid var(--hairline);
          border-radius: 6px;
          padding: 10px 12px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          flex-shrink: 0;
        }
        .sel-banner-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .sel-banner-sub {
          font-size: 11px;
          color: var(--on-surface-variant);
        }

        .snippet-card {
          background: var(--surface);
          border: 1px solid var(--hairline);
          border-radius: 6px;
          overflow: hidden;
          flex-shrink: 0;
        }
        .snippet-card-highlighted {
          border-color: var(--primary);
        }
        .snippet-header {
          padding: 8px 12px;
          background: var(--surface-low);
          border-bottom: 1px solid var(--hairline);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }
        .snippet-meta {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
        }
        .snippet-right {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .token-badge {
          font-size: 10px;
          color: var(--tertiary-light);
          background: rgba(16, 185, 129, 0.14);
          padding: 2px 6px;
          border-radius: 3px;
        }
        .snippet-reasons {
          padding: 4px 12px;
          background: var(--surface-container);
          border-bottom: 1px solid var(--hairline);
          font-size: 10.5px;
          color: var(--outline);
        }
        .snippet-code {
          margin: 0;
          padding: 12px;
          background: var(--surface-lowest);
          font-size: 12px;
          line-height: 1.5;
          color: var(--on-surface);
          overflow-x: auto;
        }
      `})]})},Ry=()=>{const s=ja(),o=cl(),[m,c]=Xp(),d=o.state,p=m.get("file")||(d==null?void 0:d.filePath)||"",v=m.get("symbol")||(d==null?void 0:d.symbolName)||"",[T,N]=b.useState([]),[z,y]=b.useState(p),[g,A]=b.useState([]),[B,U]=b.useState(v),[k,q]=b.useState(""),[Y,ee]=b.useState(""),[le,F]=b.useState("snippet"),[J,xe]=b.useState(null),[I,ie]=b.useState({callers:[],callees:[]}),[He,Z]=b.useState([]),[Be,Ne]=b.useState(!0),[Ee,Fe]=b.useState(!1),[je,K]=b.useState(!1),[re,ue]=b.useState(null),ze=async()=>{Ne(!0),ue(null);try{const C=await $e.getFiles();if(N(C),!z&&v){const G=await $e.searchSymbols(v,void 0,void 0,5),de=G.find(se=>se.name===v)||G[0];if(de!=null&&de.file_path){y(de.file_path);return}}if(!z&&C.length>0){const G=C.find(de=>de.path==="python/fastast/retrieval.py")||C.find(de=>de.category==="source"&&(de.symbol_count??0)>0)||C[0];y(G.path)}}catch(C){ue((C==null?void 0:C.message)||"Failed to load repository files from /api/files.")}finally{Ne(!1)}};b.useEffect(()=>{ze()},[]),b.useEffect(()=>{const C=m.get("file"),G=m.get("symbol");C&&C!==z&&y(C),G&&G!==B&&U(G)},[m]),b.useEffect(()=>{if(!z)return;let C=!1;return Fe(!0),$e.getOutline(z).then(G=>{C||(A(G),Fe(!1),G.length>0?G.find(se=>se.name===B)||U(G[0].name):(U(""),$e.getSnippet(void 0,z,1,60).then(de=>{C||xe(de)}).catch(()=>{})))}).catch(G=>{C||(ue((G==null?void 0:G.message)||"Failed to load file outline."),Fe(!1))}),()=>{C=!0}},[z]),b.useEffect(()=>{if(!B)return;let C=!1;return K(!0),Promise.all([$e.getSnippet(B,z||void 0).catch(()=>null),$e.getCallGraph(B).catch(()=>({symbol:B,callers:[],callees:[]})),$e.getSimilarSymbols(B,6).catch(()=>[])]).then(([G,de,se])=>{C||(xe(G),ie({callers:de.callers||[],callees:de.callees||[]}),Z(se||[]),K(!1))}),()=>{C=!0}},[B,z]);const ce=b.useMemo(()=>g.find(C=>C.name===B)||g[0],[g,B]),nt=b.useMemo(()=>{const C=k.trim().toLowerCase();return C?T.filter(G=>G.path.toLowerCase().includes(C)||G.language.toLowerCase().includes(C)):T},[T,k]),Q=b.useMemo(()=>{const C=Y.trim().toLowerCase();return C?g.filter(G=>G.name.toLowerCase().includes(C)||G.kind.toLowerCase().includes(C)||(G.signature||"").toLowerCase().includes(C)):g},[g,Y]),fe=b.useMemo(()=>J!=null&&J.content?J.content.split(`
`):[],[J]),h=C=>{y(C),c({file:C})},D=(C,G)=>{G&&G!==z?(y(G),U(C),c({file:G,symbol:C})):(U(C),c({file:z,symbol:C}))};return u.jsxs("div",{className:"explore-layout",children:[u.jsxs("aside",{className:"explore-left",children:[u.jsxs("div",{className:"subpanel files-subpanel",children:[u.jsxs("div",{className:"subpanel-header",children:[u.jsx("span",{className:"material-symbols-outlined text-primary text-sm",children:"folder_open"}),u.jsxs("span",{className:"subpanel-title",children:["Indexed Files (",nt.length,")"]})]}),u.jsx("div",{className:"filter-box",children:u.jsx("input",{type:"text",value:k,onChange:C=>q(C.target.value),placeholder:"Filter files by path or language...",className:"filter-input font-code"})}),u.jsx("div",{className:"subpanel-list font-code",children:Be?u.jsx("div",{className:"empty-msg",children:"Loading files..."}):nt.length>0?nt.map(C=>{const G=C.path===z;return u.jsxs("div",{className:`tree-row ${G?"tree-row-active":""}`,onClick:()=>h(C.path),title:`${C.path} (${C.language}, ${C.lines} lines)`,children:[u.jsx("span",{className:"tree-path truncate",children:C.path}),u.jsx("span",{className:"tree-meta",children:C.symbol_count!==void 0&&C.symbol_count>0?`${C.symbol_count} sym`:`${C.lines}L`})]},C.path)}):u.jsx("div",{className:"empty-msg",children:"No matching files"})})]}),u.jsxs("div",{className:"subpanel outline-subpanel",children:[u.jsxs("div",{className:"subpanel-header",children:[u.jsx("span",{className:"material-symbols-outlined text-secondary text-sm",children:"data_object"}),u.jsxs("span",{className:"subpanel-title",children:["File Symbols (",Q.length,")"]})]}),u.jsx("div",{className:"filter-box",children:u.jsx("input",{type:"text",value:Y,onChange:C=>ee(C.target.value),placeholder:"Filter symbols in file...",className:"filter-input font-code"})}),u.jsx("div",{className:"subpanel-list font-code",children:Ee?u.jsx("div",{className:"empty-msg",children:"Loading AST outline..."}):Q.length>0?Q.map(C=>{const G=C.name===B;return u.jsxs("div",{className:`tree-row ${G?"tree-row-active":""}`,onClick:()=>D(C.name),children:[u.jsxs("div",{className:"sym-row-left",children:[u.jsx("span",{className:`sym-kind-tag kind-${C.kind.toLowerCase()}`,children:C.kind.slice(0,3).toUpperCase()}),u.jsx("span",{className:"tree-path truncate",children:C.name})]}),u.jsxs("span",{className:"tree-meta",children:["L",C.start_line,"–",C.end_line]})]},`${C.id}-${C.start_line}`)}):u.jsx("div",{className:"empty-msg",children:"No AST symbols extracted in this file"})})]})]}),u.jsxs("main",{className:"explore-center",children:[u.jsxs("div",{className:"center-toolbar",children:[u.jsxs("div",{className:"breadcrumb font-code",children:[u.jsx("span",{className:"material-symbols-outlined text-primary text-sm",children:"description"}),u.jsx("span",{className:"text-on-surface font-semibold",children:z||"Select a file"}),B&&u.jsxs(u.Fragment,{children:[u.jsx("span",{className:"text-outline",children:"/"}),u.jsx("span",{className:"text-primary font-bold",children:B})]})]}),u.jsxs("div",{className:"view-tabs",children:[u.jsx("button",{className:`tab-btn ${le==="snippet"?"tab-btn-active":""}`,onClick:()=>F("snippet"),children:"Bounded Snippet"}),u.jsxs("button",{className:`tab-btn ${le==="outline"?"tab-btn-active":""}`,onClick:()=>F("outline"),children:["AST Outline (",g.length,")"]}),u.jsxs("button",{className:`tab-btn ${le==="calls"?"tab-btn-active":""}`,onClick:()=>F("calls"),children:["Call Neighborhood (",I.callers.length+I.callees.length,")"]})]}),u.jsx("div",{className:"toolbar-actions",children:B&&u.jsxs(u.Fragment,{children:[u.jsxs("button",{className:"act-btn act-btn-secondary",onClick:()=>s(`/evidence?q=${encodeURIComponent(B)}`),children:[u.jsx("span",{className:"material-symbols-outlined text-xs",children:"manage_search"}),u.jsx("span",{children:"Evidence"})]}),u.jsxs("button",{className:"act-btn act-btn-primary",onClick:()=>s(`/globe?symbol=${encodeURIComponent(B)}`),children:[u.jsx("span",{className:"material-symbols-outlined text-xs",children:"public"}),u.jsx("span",{children:"Focus in Globe"})]})]})})]}),re&&u.jsx("div",{className:"p-3",children:u.jsxs("div",{className:"api-error-banner",children:[u.jsx("div",{children:re}),u.jsx("button",{className:"api-retry-btn",onClick:ze,children:"Retry"})]})}),le==="snippet"&&u.jsxs("div",{className:"code-viewer-wrap",children:[u.jsxs("div",{className:"code-meta-bar font-code",children:[u.jsxs("span",{children:[(J==null?void 0:J.file_path)||z," • Lines"," ",(J==null?void 0:J.start_line)??(ce==null?void 0:ce.start_line)??1,"–",(J==null?void 0:J.end_line)??(ce==null?void 0:ce.end_line)??1]}),u.jsxs("span",{className:"text-tertiary",children:["Bounded AST Window (~",(J==null?void 0:J.tokens)||Math.max(10,fe.length*7)," ","tokens)"]})]}),u.jsx("div",{className:"code-scroll font-code",children:je?u.jsx("div",{className:"p-6 text-outline",children:"Extracting bounded AST snippet..."}):fe.length>0?fe.map((C,G)=>{const de=((J==null?void 0:J.start_line)??1)+G;return u.jsxs("div",{className:"code-line",children:[u.jsx("span",{className:"line-num",children:de}),u.jsx("span",{className:"line-text",children:C||" "})]},G)}):u.jsx("div",{className:"p-6 text-outline",children:"Select a symbol or file to view its bounded source window."})})]}),le==="outline"&&u.jsx("div",{className:"outline-table-wrap font-code",children:g.length>0?u.jsxs("table",{className:"ast-table",children:[u.jsx("thead",{children:u.jsxs("tr",{children:[u.jsx("th",{children:"Kind"}),u.jsx("th",{children:"Symbol"}),u.jsx("th",{children:"Signature"}),u.jsx("th",{children:"Lines"})]})}),u.jsx("tbody",{children:g.map(C=>u.jsxs("tr",{className:C.name===B?"row-selected":"",onClick:()=>{D(C.name),F("snippet")},children:[u.jsx("td",{children:u.jsx("span",{className:`sym-kind-tag kind-${C.kind.toLowerCase()}`,children:C.kind})}),u.jsx("td",{className:"text-primary font-semibold",children:C.name}),u.jsx("td",{className:"text-on-surface-variant truncate max-w-md",children:C.signature}),u.jsxs("td",{className:"text-outline",children:["L",C.start_line,"–",C.end_line]})]},`${C.id}-${C.start_line}`))})]}):u.jsxs("div",{className:"p-6 text-outline",children:["No AST symbols found in ",z,"."]})}),le==="calls"&&u.jsxs("div",{className:"calls-tab-wrap font-code",children:[u.jsxs("div",{className:"calls-col",children:[u.jsxs("div",{className:"calls-col-hdr",children:["Inbound Callers (",I.callers.length,")"]}),I.callers.length>0?I.callers.map((C,G)=>u.jsxs("div",{className:"call-card",onClick:()=>C.caller&&D(C.caller,C.file_path),children:[u.jsx("span",{className:"text-primary font-semibold",children:C.caller}),u.jsxs("span",{className:"text-outline text-xs",children:[C.file_path,":L",C.line_number]})]},G)):u.jsx("div",{className:"text-outline text-xs",children:"No inbound callers recorded"})]}),u.jsxs("div",{className:"calls-col",children:[u.jsxs("div",{className:"calls-col-hdr",children:["Outbound Callees (",I.callees.length,")"]}),I.callees.length>0?I.callees.map((C,G)=>u.jsxs("div",{className:"call-card",onClick:()=>C.callee&&D(C.callee,C.file_path),children:[u.jsx("span",{className:"text-tertiary font-semibold",children:C.callee}),u.jsxs("span",{className:"text-outline text-xs",children:[C.file_path,":L",C.line_number]})]},G)):u.jsx("div",{className:"text-outline text-xs",children:"No outbound callees recorded"})]})]})]}),u.jsxs("aside",{className:"explore-right",children:[u.jsxs("div",{className:"subpanel-header",children:[u.jsx("span",{className:"material-symbols-outlined text-primary text-sm",children:"info"}),u.jsx("span",{className:"subpanel-title",children:"Symbol Details"})]}),ce?u.jsxs("div",{className:"right-scroll",children:[u.jsxs("div",{className:"detail-box",children:[u.jsxs("div",{className:"flex justify-between items-center",children:[u.jsx("span",{className:"sym-kind-tag",children:ce.kind.toUpperCase()}),u.jsxs("span",{className:"font-code text-xs text-outline",children:["L",ce.start_line,"–",ce.end_line]})]}),u.jsx("div",{className:"detail-sym-name font-code",children:ce.name}),u.jsx("div",{className:"font-code text-xs text-outline truncate",children:ce.file_path||z}),ce.signature&&u.jsx("pre",{className:"detail-sig font-code",children:ce.signature}),ce.docstring&&u.jsx("p",{className:"detail-doc",children:ce.docstring})]}),u.jsxs("div",{className:"detail-box",children:[u.jsxs("div",{className:"box-hdr font-code",children:["Inbound Callers (",I.callers.length,")"]}),I.callers.length>0?u.jsx("div",{className:"mini-list font-code",children:I.callers.slice(0,10).map((C,G)=>u.jsxs("div",{className:"mini-item",onClick:()=>C.caller&&D(C.caller,C.file_path),children:[u.jsx("span",{className:"text-primary truncate",children:C.caller}),u.jsxs("span",{className:"text-outline text-xs",children:["L",C.line_number]})]},G))}):u.jsx("div",{className:"text-xs text-outline font-code",children:"None"})]}),u.jsxs("div",{className:"detail-box",children:[u.jsxs("div",{className:"box-hdr font-code",children:["Outbound Callees (",I.callees.length,")"]}),I.callees.length>0?u.jsx("div",{className:"mini-list font-code",children:I.callees.slice(0,10).map((C,G)=>u.jsxs("div",{className:"mini-item",onClick:()=>C.callee&&D(C.callee,C.file_path),children:[u.jsx("span",{className:"text-tertiary truncate",children:C.callee}),u.jsxs("span",{className:"text-outline text-xs",children:["L",C.line_number]})]},G))}):u.jsx("div",{className:"text-xs text-outline font-code",children:"None"})]}),u.jsxs("div",{className:"detail-box",children:[u.jsxs("div",{className:"box-hdr font-code",children:["Similar Symbols (",He.length,")"]}),He.length>0?u.jsx("div",{className:"mini-list font-code",children:He.map((C,G)=>u.jsxs("div",{className:"mini-item",onClick:()=>D(C.name,C.file_path),children:[u.jsx("span",{className:"text-secondary truncate",children:C.name}),u.jsxs("span",{className:"text-outline text-xs",children:[Math.round(C.similarity*100),"%"]})]},G))}):u.jsx("div",{className:"text-xs text-outline font-code",children:"None detected"})]})]}):u.jsx("div",{className:"p-4 text-xs text-outline font-code",children:"Select a symbol to inspect metadata and relationships."})]}),u.jsx("style",{children:`
        .explore-layout {
          width: 100%;
          height: 100%;
          display: flex;
          background: var(--surface-lowest);
          overflow: hidden;
        }
        .explore-left {
          width: 310px;
          flex-shrink: 0;
          height: 100%;
          background: var(--surface-low);
          border-right: 1px solid var(--hairline);
          display: flex;
          flex-direction: column;
        }
        .subpanel {
          display: flex;
          flex-direction: column;
          min-height: 0;
        }
        .files-subpanel {
          flex: 1.1;
          border-bottom: 1px solid var(--hairline);
        }
        .outline-subpanel {
          flex: 1;
        }
        .subpanel-header {
          height: 38px;
          padding: 0 12px;
          background: var(--surface);
          border-bottom: 1px solid var(--hairline);
          display: flex;
          align-items: center;
          gap: 7px;
          flex-shrink: 0;
        }
        .subpanel-title {
          font-size: 11.5px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          color: var(--on-surface);
        }
        .filter-box {
          padding: 6px 8px;
          border-bottom: 1px solid var(--hairline);
          background: var(--surface-low);
        }
        .filter-input {
          width: 100%;
          height: 26px;
          background: var(--surface-lowest);
          border: 1px solid var(--hairline);
          border-radius: 4px;
          padding: 0 8px;
          color: var(--on-surface);
          font-size: 11px;
          outline: none;
        }
        .filter-input:focus {
          border-color: var(--primary);
        }
        .subpanel-list {
          flex: 1;
          overflow-y: auto;
          padding: 4px;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .tree-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          padding: 5px 8px;
          border-radius: 4px;
          font-size: 11.5px;
          color: var(--on-surface-variant);
          cursor: pointer;
        }
        .tree-row:hover {
          background: var(--surface);
          color: var(--on-surface);
        }
        .tree-row-active {
          background: var(--primary-container);
          color: var(--primary);
          font-weight: 600;
        }
        .tree-path {
          flex: 1;
          min-width: 0;
        }
        .tree-meta {
          font-size: 10px;
          color: var(--outline);
          flex-shrink: 0;
        }
        .sym-row-left {
          display: flex;
          align-items: center;
          gap: 6px;
          min-width: 0;
          flex: 1;
        }
        .sym-kind-tag {
          font-family: var(--font-mono);
          font-size: 9.5px;
          font-weight: 700;
          padding: 1px 5px;
          border-radius: 3px;
          background: var(--surface-high);
          color: var(--primary);
          flex-shrink: 0;
        }
        .empty-msg {
          padding: 16px;
          text-align: center;
          color: var(--outline);
          font-size: 11.5px;
        }

        /* Center Workspace */
        .explore-center {
          flex: 1;
          height: 100%;
          display: flex;
          flex-direction: column;
          min-width: 0;
          background: var(--surface-lowest);
        }
        .center-toolbar {
          height: 44px;
          padding: 0 14px;
          background: var(--surface);
          border-bottom: 1px solid var(--hairline);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-shrink: 0;
        }
        .breadcrumb {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          min-width: 0;
          overflow: hidden;
        }
        .view-tabs {
          display: flex;
          gap: 4px;
          background: var(--surface-low);
          padding: 3px;
          border-radius: 5px;
          border: 1px solid var(--hairline);
        }
        .tab-btn {
          background: transparent;
          border: none;
          color: var(--outline);
          font-size: 11.5px;
          font-weight: 600;
          padding: 4px 10px;
          border-radius: 4px;
          cursor: pointer;
        }
        .tab-btn-active {
          background: var(--surface-high);
          color: var(--primary);
        }
        .toolbar-actions {
          display: flex;
          gap: 6px;
        }
        .act-btn {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 5px 10px;
          border-radius: 4px;
          font-size: 11.5px;
          font-weight: 600;
          cursor: pointer;
          border: 1px solid var(--hairline);
        }
        .act-btn-secondary {
          background: var(--surface-container);
          color: var(--on-surface);
        }
        .act-btn-primary {
          background: var(--primary);
          color: var(--on-primary);
          border-color: transparent;
        }

        .code-viewer-wrap {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-height: 0;
        }
        .code-meta-bar {
          padding: 6px 14px;
          background: var(--surface-low);
          border-bottom: 1px solid var(--hairline);
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          color: var(--outline);
        }
        .code-scroll {
          flex: 1;
          overflow: auto;
          padding: 10px 0;
          font-size: 12px;
          line-height: 1.55;
        }
        .code-line {
          display: flex;
          padding: 0 14px;
        }
        .code-line:hover {
          background: rgba(56, 189, 248, 0.06);
        }
        .line-num {
          width: 44px;
          flex-shrink: 0;
          color: var(--outline);
          user-select: none;
          text-align: right;
          padding-right: 14px;
        }
        .line-text {
          white-space: pre;
          color: var(--on-surface);
        }

        .outline-table-wrap {
          flex: 1;
          overflow: auto;
          padding: 14px;
        }
        .ast-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12px;
        }
        .ast-table th {
          text-align: left;
          padding: 8px 10px;
          border-bottom: 1px solid var(--hairline);
          color: var(--outline);
          font-size: 10.5px;
          text-transform: uppercase;
        }
        .ast-table td {
          padding: 8px 10px;
          border-bottom: 1px solid var(--hairline);
          cursor: pointer;
        }
        .ast-table tr:hover td {
          background: var(--surface);
        }
        .row-selected td {
          background: var(--primary-container);
        }

        .calls-tab-wrap {
          flex: 1;
          overflow: auto;
          padding: 16px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        .calls-col {
          background: var(--surface);
          border: 1px solid var(--hairline);
          border-radius: 6px;
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .calls-col-hdr {
          font-size: 11px;
          text-transform: uppercase;
          color: var(--outline);
          font-weight: 700;
          padding-bottom: 6px;
          border-bottom: 1px solid var(--hairline);
        }
        .call-card {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 7px 10px;
          background: var(--surface-low);
          border: 1px solid var(--hairline);
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
        }
        .call-card:hover {
          border-color: var(--primary);
        }

        /* Right Panel */
        .explore-right {
          width: 300px;
          flex-shrink: 0;
          height: 100%;
          background: var(--surface-low);
          border-left: 1px solid var(--hairline);
          display: flex;
          flex-direction: column;
        }
        .right-scroll {
          flex: 1;
          overflow-y: auto;
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .detail-box {
          background: var(--surface);
          border: 1px solid var(--hairline);
          border-radius: 6px;
          padding: 10px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .detail-sym-name {
          font-size: 13.5px;
          font-weight: 700;
          color: var(--on-surface);
          word-break: break-all;
        }
        .detail-sig {
          margin: 0;
          padding: 6px 8px;
          background: var(--surface-lowest);
          border: 1px solid var(--hairline);
          border-radius: 4px;
          font-size: 11px;
          color: var(--on-surface-variant);
          white-space: pre-wrap;
          overflow-x: auto;
        }
        .detail-doc {
          margin: 0;
          font-size: 11.5px;
          color: var(--on-surface-variant);
          line-height: 1.45;
        }
        .box-hdr {
          font-size: 10px;
          text-transform: uppercase;
          color: var(--outline);
          font-weight: 700;
        }
        .mini-list {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .mini-item {
          display: flex;
          justify-content: space-between;
          gap: 6px;
          padding: 4px 7px;
          background: var(--surface-low);
          border: 1px solid var(--hairline);
          border-radius: 4px;
          font-size: 11px;
          cursor: pointer;
        }
        .mini-item:hover {
          border-color: var(--primary);
        }
      `})]})},Oy={CALLS:"#38bdf8",IMPORTS:"#10b981",DEFINES:"#a855f7",INHERITS:"#f59e0b",SIMILAR_TO:"#ec4899"},Wi={function:"#38bdf8",method:"#60a5fa",class:"#a855f7",type:"#818cf8",struct:"#f59e0b",file:"#10b981",module:"#10b981"},Sp={mode:"full",depth:2,total_nodes:18,total_edges:20,repo_total_nodes:142,repo_total_edges:284,communities:[{id:0,name:"Database & Storage",color:"#38bdf8",count:6},{id:1,name:"API Server",color:"#10b981",count:5},{id:2,name:"AST Parser",color:"#a855f7",count:3},{id:3,name:"Imported Modules",color:"#34d399",count:3},{id:4,name:"Testing Suite",color:"#f59e0b",count:1}],nodes:[{id:"get_call_graph",name:"get_call_graph",kind:"function",file_path:"python/fastast/db.py",start_line:120,end_line:145,language:"python",in_degree:3,out_degree:3,comm:0,comm_name:"Database & Storage",comm_color:"#38bdf8",importance:.95,signature:"def get_call_graph(conn, symbol_name: str)"},{id:"CodeGraph",name:"CodeGraph",kind:"class",file_path:"python/fastast/graph.py",start_line:15,end_line:85,language:"python",in_degree:2,out_degree:2,comm:0,comm_name:"Database & Storage",comm_color:"#38bdf8",importance:.9,signature:"class CodeGraph"},{id:"CodeGraph.add_node",name:"CodeGraph.add_node",kind:"method",file_path:"python/fastast/graph.py",start_line:30,end_line:45,language:"python",in_degree:1,out_degree:0,comm:0,comm_name:"Database & Storage",comm_color:"#38bdf8",importance:.7,signature:"def add_node(self, node: Node) -> None"},{id:"CodeGraph.add_edge",name:"CodeGraph.add_edge",kind:"method",file_path:"python/fastast/graph.py",start_line:50,end_line:65,language:"python",in_degree:1,out_degree:0,comm:0,comm_name:"Database & Storage",comm_color:"#38bdf8",importance:.7,signature:"def add_edge(self, u: str, v: str, rel: str) -> None"},{id:"sqlite.cursor",name:"sqlite.cursor",kind:"function",file_path:"external:sqlite3",start_line:1,end_line:1,language:"python",in_degree:1,out_degree:0,comm:0,comm_name:"Database & Storage",comm_color:"#38bdf8",importance:.6,signature:"cursor()"},{id:"format_edges",name:"format_edges",kind:"function",file_path:"python/fastast/db.py",start_line:165,end_line:185,language:"python",in_degree:1,out_degree:1,comm:0,comm_name:"Database & Storage",comm_color:"#38bdf8",importance:.7,signature:"def format_edges(rows)"},{id:"FastASTAPIHandler",name:"FastASTAPIHandler",kind:"class",file_path:"python/fastast/api_server.py",start_line:168,end_line:230,language:"python",in_degree:2,out_degree:2,comm:1,comm_name:"API Server",comm_color:"#10b981",importance:.88,signature:"class FastASTAPIHandler(BaseHTTPRequestHandler)"},{id:"FastASTAPIHandler.do_GET",name:"FastASTAPIHandler.do_GET",kind:"method",file_path:"python/fastast/api_server.py",start_line:218,end_line:280,language:"python",in_degree:1,out_degree:1,comm:1,comm_name:"API Server",comm_color:"#10b981",importance:.82,signature:"def do_GET(self) -> None"},{id:"FastASTAPIHandler.do_POST",name:"FastASTAPIHandler.do_POST",kind:"method",file_path:"python/fastast/api_server.py",start_line:190,end_line:215,language:"python",in_degree:1,out_degree:0,comm:1,comm_name:"API Server",comm_color:"#10b981",importance:.75,signature:"def do_POST(self) -> None"},{id:"handle_graph",name:"handle_graph",kind:"function",file_path:"python/fastast/api_server.py",start_line:84,end_line:110,language:"python",in_degree:2,out_degree:1,comm:1,comm_name:"API Server",comm_color:"#10b981",importance:.8,signature:"def handle_graph(self) -> None"},{id:"server.inspect",name:"server.inspect",kind:"method",file_path:"python/fastast/server.py",start_line:210,end_line:235,language:"python",in_degree:1,out_degree:1,comm:1,comm_name:"API Server",comm_color:"#10b981",importance:.75,signature:"def inspect(self, symbol: str)"},{id:"ASTParser",name:"ASTParser",kind:"class",file_path:"python/fastast/parser.py",start_line:20,end_line:95,language:"python",in_degree:2,out_degree:2,comm:2,comm_name:"AST Parser",comm_color:"#a855f7",importance:.85,signature:"class ASTParser"},{id:"ASTParser.extract_symbols",name:"ASTParser.extract_symbols",kind:"method",file_path:"python/fastast/parser.py",start_line:35,end_line:60,language:"python",in_degree:1,out_degree:0,comm:2,comm_name:"AST Parser",comm_color:"#a855f7",importance:.75,signature:"def extract_symbols(self, code: str)"},{id:"parse_edge_kind",name:"parse_edge_kind",kind:"function",file_path:"python/fastast/parser.py",start_line:44,end_line:60,language:"python",in_degree:1,out_degree:0,comm:2,comm_name:"AST Parser",comm_color:"#a855f7",importance:.65,signature:"def parse_edge_kind(kind: str)"},{id:"sqlite3",name:"sqlite3",kind:"module",file_path:"external:sqlite3",start_line:1,end_line:1,language:"python",in_degree:1,out_degree:0,comm:3,comm_name:"Imported Modules",comm_color:"#34d399",importance:.85,signature:"import sqlite3"},{id:"fastast.model",name:"fastast.model",kind:"module",file_path:"python/fastast/model.py",start_line:1,end_line:50,language:"python",in_degree:1,out_degree:0,comm:3,comm_name:"Imported Modules",comm_color:"#34d399",importance:.8,signature:"from fastast.model import Candidate, SymbolRecord"},{id:"typing",name:"typing",kind:"module",file_path:"stdlib:typing",start_line:1,end_line:1,language:"python",in_degree:1,out_degree:0,comm:3,comm_name:"Imported Modules",comm_color:"#34d399",importance:.75,signature:"import typing"},{id:"test_get_call_graph",name:"test_get_call_graph",kind:"function",file_path:"tests/test_db.py",start_line:32,end_line:55,language:"python",in_degree:0,out_degree:1,comm:4,comm_name:"Testing Suite",comm_color:"#f59e0b",importance:.7,signature:"def test_get_call_graph()"}],edges:[{source:"CodeGraph",target:"CodeGraph.add_node",type:"DEFINES"},{source:"CodeGraph",target:"CodeGraph.add_edge",type:"DEFINES"},{source:"FastASTAPIHandler",target:"FastASTAPIHandler.do_GET",type:"DEFINES"},{source:"FastASTAPIHandler",target:"FastASTAPIHandler.do_POST",type:"DEFINES"},{source:"ASTParser",target:"ASTParser.extract_symbols",type:"DEFINES"},{source:"FastASTAPIHandler.do_GET",target:"handle_graph",type:"CALLS"},{source:"handle_graph",target:"get_call_graph",type:"CALLS"},{source:"test_get_call_graph",target:"get_call_graph",type:"CALLS"},{source:"server.inspect",target:"get_call_graph",type:"CALLS"},{source:"get_call_graph",target:"sqlite.cursor",type:"CALLS"},{source:"get_call_graph",target:"format_edges",type:"CALLS"},{source:"format_edges",target:"parse_edge_kind",type:"CALLS"},{source:"get_call_graph",target:"sqlite3",type:"IMPORTS"},{source:"get_call_graph",target:"fastast.model",type:"IMPORTS"},{source:"get_call_graph",target:"typing",type:"IMPORTS"}]},wy=[{module:"sqlite3",name:null,file_path:"python/fastast/db.py",line_number:4},{module:"fastast.model",name:"Candidate",file_path:"python/fastast/db.py",line_number:10},{module:"typing",name:"Dict",file_path:"python/fastast/db.py",line_number:7},{module:"fastast.config",name:"get_logger",file_path:"python/fastast/db.py",line_number:9}],My=({connectionVersion:s=0,onNavigateToExplore:o})=>{const m=b.useRef(null),c=b.useRef(null),[d,p]=b.useState(Sp),[v,T]=b.useState(Sp.nodes[0]),[N,z]=b.useState([]),[y,g]=b.useState([]),[A,B]=b.useState(wy),[U,k]=b.useState(!1),[q,Y]=b.useState(!1),[ee,le]=b.useState(!1),[F,J]=b.useState(""),[xe,I]=b.useState(1),[ie,He]=b.useState({CALLS:!0,IMPORTS:!0,DEFINES:!0,SIMILAR_TO:!0}),[Z,Be]=b.useState(!0),[Ne,Ee]=b.useState({x:0,y:0}),[Fe,je]=b.useState(1),K=b.useRef([]),re=b.useCallback(Q=>{const fe=(Q??xe)==="all";$e.getGlobeTopology({mode:"full",maxNodes:fe?450:200,maxEdges:fe?1400:600}).then(h=>{h&&h.nodes&&h.nodes.length>0?(p(h),k(!1)):k(!0)}).catch(()=>{k(!0)})},[xe]);b.useEffect(()=>{re()},[s,re]),b.useEffect(()=>{if(!v){z([]),g([]),B([]);return}Y(!0),$e.getCallGraph(v.name).then(Q=>{z(Q.callers||[]),g(Q.callees||[]),B(Q.imports||[]),Y(!1)}).catch(()=>{z([]),g([]),B([]),Y(!1)})},[v]);const ue=b.useMemo(()=>{const Q={CALLS:0,IMPORTS:0,DEFINES:0,SIMILAR_TO:0};return(d.edges||[]).forEach(fe=>{const h=(fe.type||"CALLS").toUpperCase();Q[h]=(Q[h]||0)+1}),A.length>Q.IMPORTS&&(Q.IMPORTS=A.length),Q},[d.edges,A]),ze=b.useMemo(()=>{if(!F.trim())return[];const Q=F.toLowerCase();return(d.nodes||[]).filter(fe=>fe.name.toLowerCase().includes(Q)||fe.file_path&&fe.file_path.toLowerCase().includes(Q)).slice(0,10)},[F,d.nodes]),ce=b.useCallback(()=>{Ee({x:0,y:0}),je(1)},[]),nt=()=>{if(!v)return;const Q=JSON.stringify({symbol:v.name,kind:v.kind,file:v.file_path,signature:v.signature,community:v.comm_name,in_degree:v.in_degree,out_degree:v.out_degree,callers:N.map(fe=>({caller:fe.caller,file:fe.file_path,line:fe.line_number})),callees:y.map(fe=>({callee:fe.callee,file:fe.file_path,line:fe.line_number})),imports:A.map(fe=>({module:fe.module,name:fe.name,file:fe.file_path,line:fe.line_number}))},null,2);navigator.clipboard.writeText(Q),le(!0),setTimeout(()=>le(!1),2e3)};return b.useEffect(()=>{const Q=c.current,fe=m.current;if(!Q||!fe)return;const h=Q.getContext("2d");if(!h)return;let D,C=0,G=!1,de=!1,se=null,Ae={x:0,y:0},ae=!1;const ne=new Map;d.nodes.forEach(V=>{ne.set(V.id,V),ne.set(V.name,V)});const Me=v||d.nodes[0];if(!Me)return;const Yt=fe.clientWidth||900,wt=fe.clientHeight||650,Ze=new Map,Ie=[],De=Me.name,Ft=Me.comm_color||Wi[Me.kind]||"#38bdf8";Ze.set(De,{id:Me.id,name:Me.name,kind:Me.kind||"function",filePath:Me.file_path||"",startLine:Me.start_line,endLine:Me.end_line,x:Yt/2,y:wt/2,radius:22,color:Ft,community:Me.comm_name||"Core",inDegree:Me.in_degree||N.length,outDegree:Me.out_degree||y.length,isCenter:!0,isInbound:!1,isOutbound:!1,isImport:!1,rawNode:Me});const wl=new Set;N.forEach(V=>{V.caller&&wl.add(V.caller)}),d.edges.forEach(V=>{const me=V.source??V.src,M=V.target??V.dst;if(M===Me.id||M===Me.name){const P=ne.get(me);P&&wl.add(P.name)}});const It=new Set;y.forEach(V=>{V.callee&&It.add(V.callee)}),d.edges.forEach(V=>{const me=V.source??V.src,M=V.target??V.dst;if(me===Me.id||me===Me.name){const P=ne.get(M);P&&It.add(P.name)}});const jt=xe==="all",vl=xe===2,Ml=Array.from(wl).slice(0,jt?100:vl?16:8);Ml.forEach((V,me)=>{const M=ne.get(V),P=wt/2+(me-(Ml.length-1)/2)*(jt?46:62),X=Math.max(90,Yt/2-(jt?320:250)),ve=(M==null?void 0:M.comm_color)||Wi[(M==null?void 0:M.kind)||"function"]||"#38bdf8";Ze.set(V,{id:(M==null?void 0:M.id)||V,name:V,kind:(M==null?void 0:M.kind)||"function",filePath:(M==null?void 0:M.file_path)||"",startLine:M==null?void 0:M.start_line,endLine:M==null?void 0:M.end_line,x:X,y:P,radius:15,color:ve,community:(M==null?void 0:M.comm_name)||"Caller",inDegree:(M==null?void 0:M.in_degree)||1,outDegree:(M==null?void 0:M.out_degree)||1,isCenter:!1,isInbound:!0,isOutbound:!1,isImport:!1,isSubNode:(M==null?void 0:M.kind)==="method"||(M==null?void 0:M.kind)==="function",rawNode:M}),ie.CALLS&&Ie.push({from:V,to:De,type:"CALLS",color:"#38bdf8"})});const en=Array.from(It).slice(0,jt?100:vl?16:8);en.forEach((V,me)=>{const M=ne.get(V),P=wt/2+(me-(en.length-1)/2)*(jt?46:62),X=Math.min(Yt-90,Yt/2+(jt?320:250)),ve=(M==null?void 0:M.comm_color)||Wi[(M==null?void 0:M.kind)||"function"]||"#a855f7";Ze.set(V,{id:(M==null?void 0:M.id)||V,name:V,kind:(M==null?void 0:M.kind)||"function",filePath:(M==null?void 0:M.file_path)||"",startLine:M==null?void 0:M.start_line,endLine:M==null?void 0:M.end_line,x:X,y:P,radius:15,color:ve,community:(M==null?void 0:M.comm_name)||"Callee",inDegree:(M==null?void 0:M.in_degree)||1,outDegree:(M==null?void 0:M.out_degree)||1,isCenter:!1,isInbound:!1,isOutbound:!0,isImport:!1,isSubNode:(M==null?void 0:M.kind)==="method"||(M==null?void 0:M.kind)==="function",rawNode:M}),ie.CALLS&&Ie.push({from:De,to:V,type:"CALLS",color:"#a855f7"})});const Fl=[],Il=new Set;if(A.forEach(V=>{const me=V.name?`${V.name}`:V.module;!Il.has(me)&&me!==De&&(Il.add(me),Fl.push({id:`imp_${me}`,name:me,module:V.module,file_path:V.file_path,line:V.line_number}))}),d.edges.forEach(V=>{var M,P;if((V.type||"").toUpperCase()==="IMPORTS"){const X=V.source??V.src,ve=V.target??V.dst,Ue=((M=ne.get(X))==null?void 0:M.name)||X,ye=((P=ne.get(ve))==null?void 0:P.name)||ve;if((X===Me.id||X===Me.name||Ue===Me.name)&&ye!==De&&!Il.has(ye)){Il.add(ye);const he=ne.get(ve);Fl.push({id:(he==null?void 0:he.id)||`imp_${ye}`,name:ye,module:ye,file_path:he==null?void 0:he.file_path,line:he==null?void 0:he.start_line})}}}),ie.IMPORTS){const V=Fl.slice(0,jt?100:vl?16:8);V.forEach((me,M)=>{const P=ne.get(me.name)||ne.get(me.module),X=V.length,ve=Math.min(Yt-240,Math.max(220,X*(jt?85:105))),Ue=Yt/2+(X>1?(M/(X-1)-.5)*ve:0),ye=X>2?Math.sin(M/(X-1)*Math.PI)*26:0,he=Math.max(75,wt/2-(jt?220:180)-ye);Ze.set(me.name,{id:me.id,name:me.name,kind:(P==null?void 0:P.kind)||"module",filePath:me.file_path||(P==null?void 0:P.file_path)||"",startLine:me.line||(P==null?void 0:P.start_line),endLine:P==null?void 0:P.end_line,x:Ue,y:he,radius:14,color:"#10b981",community:(P==null?void 0:P.comm_name)||"Imported Module",inDegree:(P==null?void 0:P.in_degree)||1,outDegree:(P==null?void 0:P.out_degree)||0,isCenter:!1,isInbound:!1,isOutbound:!1,isImport:!0,isSubNode:!1,rawNode:P}),Ie.push({from:De,to:me.name,type:"IMPORTS",color:"#10b981"})})}if(jt){const V=new Map;d.nodes.forEach(P=>{if(!Ze.has(P.name)){const X=P.comm??0;V.has(X)||V.set(X,[]),V.get(X).push(P)}});const me=Math.max(1,V.size);let M=0;V.forEach(P=>{const X=M/me*2*Math.PI-Math.PI/2,ve=Math.max(300,Math.min(Yt,wt)*.44),Ue=Yt/2+Math.cos(X)*ve,ye=wt/2+Math.sin(X)*(ve*.76);P.forEach((he,Wt)=>{var za,Aa;const gt=Math.floor(Math.sqrt(Wt)),Et=Math.max(4,gt*6),ft=Wt-gt*gt,Ct=40+gt*34,it=ft/Et*2*Math.PI,nn=Ue+Math.cos(it)*Ct,ti=ye+Math.sin(it)*(Ct*.85),li=he.comm_color||Wi[he.kind]||"#38bdf8",Ca=he.kind==="method"||he.kind==="function"||he.kind==="type"||!!he.signature&&he.signature.includes("(");Ze.set(he.name,{id:he.id,name:he.name,kind:he.kind,filePath:he.file_path,startLine:he.start_line,endLine:he.end_line,x:nn,y:ti,radius:he.kind==="class"||he.kind==="module"?16:Ca?10:13,color:li,community:he.comm_name||"Subsystem",inDegree:he.in_degree||1,outDegree:he.out_degree||1,isCenter:!1,isInbound:!1,isOutbound:!1,isImport:he.kind==="module"&&(((za=he.file_path)==null?void 0:za.startsWith("external"))||((Aa=he.file_path)==null?void 0:Aa.startsWith("stdlib"))),isSubNode:Ca,rawNode:he})}),M++})}else if(vl){let me=0;for(const M of d.nodes){if(me>=40)break;if(Ze.has(M.name))continue;if(d.edges.some(X=>{var Wt,gt;const ve=X.source??X.src,Ue=X.target??X.dst,ye=((Wt=ne.get(ve))==null?void 0:Wt.name)||ve,he=((gt=ne.get(Ue))==null?void 0:gt.name)||Ue;return ye===M.name&&Ze.has(he)||he===M.name&&Ze.has(ye)})){const X=me/40*Math.PI*2,ve=310;Ze.set(M.name,{id:M.id,name:M.name,kind:M.kind,filePath:M.file_path,startLine:M.start_line,endLine:M.end_line,x:Yt/2+Math.cos(X)*ve,y:wt/2+Math.sin(X)*(ve*.72),radius:12,color:M.comm_color||Wi[M.kind]||"#34d399",community:M.comm_name,inDegree:M.in_degree||1,outDegree:M.out_degree||1,isCenter:!1,isInbound:!1,isOutbound:!1,isImport:!1,isSubNode:M.kind==="method"||M.kind==="function",rawNode:M}),me++}}}(vl||jt)&&d.edges.forEach(V=>{var Ue,ye;const me=V.source??V.src,M=V.target??V.dst,P=((Ue=ne.get(me))==null?void 0:Ue.name)||me,X=((ye=ne.get(M))==null?void 0:ye.name)||M,ve=(V.type||"CALLS").toUpperCase();ie[ve]&&Ze.has(P)&&Ze.has(X)&&(Ie.some(he=>he.from===P&&he.to===X)||Ie.push({from:P,to:X,type:ve,color:Oy[ve]||"#38bdf8"}))});const Pn=Array.from(Ze.values());K.current=Pn;const ol=()=>{const V=fe.clientWidth,me=fe.clientHeight;if(V>0&&me>0){const M=Math.min(window.devicePixelRatio||1,2);Q.width=Math.floor(V*M),Q.height=Math.floor(me*M)}};ol();const tn=new ResizeObserver(ol);tn.observe(fe);const Ea=(V,me)=>{const M=Q.getBoundingClientRect(),P=V-M.left,X=me-M.top;return{x:(P-(M.width/2+Ne.x))/Fe+M.width/2,y:(X-(M.height/2+Ne.y))/Fe+M.height/2}},tu=V=>{Ae={x:V.clientX,y:V.clientY},ae=!1;const me=Ea(V.clientX,V.clientY),M=K.current.find(P=>{const X=P.x-me.x,ve=P.y-me.y;return Math.sqrt(X*X+ve*ve)<=P.radius+6});M?(G=!0,se=M):de=!0},ei=V=>{const me=V.clientX-Ae.x,M=V.clientY-Ae.y;if((Math.abs(me)>3||Math.abs(M)>3)&&(ae=!0),G&&se){const P=Ea(V.clientX,V.clientY);se.x=P.x,se.y=P.y}else if(de)Ee(P=>({x:P.x+me,y:P.y+M})),Ae={x:V.clientX,y:V.clientY};else{const P=Ea(V.clientX,V.clientY),X=K.current.some(ve=>{const Ue=ve.x-P.x,ye=ve.y-P.y;return Math.sqrt(Ue*Ue+ye*ye)<=ve.radius+6});Q.style.cursor=X?"pointer":"grab"}},ln=()=>{if(G&&se&&!ae)if(se.rawNode)T(se.rawNode);else{const V=ne.get(se.name);T(V||{id:se.id,name:se.name,kind:se.kind,file_path:se.filePath,start_line:se.startLine||1,end_line:se.endLine||1,language:"python",in_degree:se.inDegree,out_degree:se.outDegree,comm:0,comm_name:se.community,comm_color:se.color,importance:.8,signature:`import ${se.name}`})}G=!1,de=!1,se=null},an=V=>{V.preventDefault();const me=V.deltaY<0?1.1:.9;je(M=>Math.min(2.5,Math.max(.4,M*me)))};Q.addEventListener("mousedown",tu),window.addEventListener("mousemove",ei),window.addEventListener("mouseup",ln),Q.addEventListener("wheel",an,{passive:!1});const Ta=()=>{const V=Math.min(window.devicePixelRatio||1,2),me=Q.width/V,M=Q.height/V;if(me<=0||M<=0){D=requestAnimationFrame(Ta);return}h.save(),h.scale(V,V),h.clearRect(0,0,me,M),h.translate(me/2+Ne.x,M/2+Ne.y),h.scale(Fe,Fe),h.translate(-me/2,-M/2),h.strokeStyle="rgba(255, 255, 255, 0.04)",h.lineWidth=1;const P=44;for(let X=-600;X<me+600;X+=P)h.beginPath(),h.moveTo(X,-600),h.lineTo(X,M+600),h.stroke();for(let X=-600;X<M+600;X+=P)h.beginPath(),h.moveTo(-600,X),h.lineTo(me+600,X),h.stroke();Ie.forEach((X,ve)=>{const Ue=Ze.get(X.from),ye=Ze.get(X.to);if(!Ue||!ye)return;const he=X.from===Me.name||X.to===Me.name,Wt=X.type==="IMPORTS";h.strokeStyle=he?X.color:"rgba(100, 116, 139, 0.25)",h.lineWidth=he?Wt?2:2.2:1,Wt?h.setLineDash([5,4]):h.setLineDash([]),h.beginPath(),h.moveTo(Ue.x,Ue.y),h.lineTo(ye.x,ye.y),h.stroke(),h.setLineDash([]);const gt=7,Et=Math.atan2(ye.y-Ue.y,ye.x-Ue.x),ft=ye.radius+3,Ct=ye.x-ft*Math.cos(Et),it=ye.y-ft*Math.sin(Et);if(h.fillStyle=he?X.color:"rgba(100, 116, 139, 0.4)",h.beginPath(),h.moveTo(Ct,it),h.lineTo(Ct-gt*Math.cos(Et-Math.PI/7),it-gt*Math.sin(Et-Math.PI/7)),h.lineTo(Ct-gt*Math.cos(Et+Math.PI/7),it-gt*Math.sin(Et+Math.PI/7)),h.closePath(),h.fill(),Z&&he){const nn=(C*.015+ve*.25)%1,ti=Ue.x+(ye.x-Ue.x)*nn,li=Ue.y+(ye.y-Ue.y)*nn;h.beginPath(),h.arc(ti,li,3.5,0,Math.PI*2),h.fillStyle=X.color,h.shadowColor=X.color,h.shadowBlur=8,h.fill(),h.shadowBlur=0}}),Pn.forEach(X=>{const ve=X.isCenter,Ue=X.isInbound||X.isOutbound,ye=X.isImport;ve?(h.beginPath(),h.arc(X.x,X.y,X.radius+10,0,Math.PI*2),h.fillStyle=`${X.color}33`,h.fill()):ye&&(h.beginPath(),h.arc(X.x,X.y,X.radius+6,0,Math.PI*2),h.fillStyle="rgba(16, 185, 129, 0.16)",h.fill()),h.beginPath(),h.arc(X.x,X.y,X.radius,0,Math.PI*2),h.fillStyle=ve?X.color:ye?"rgba(16, 185, 129, 0.22)":Ue?`${X.color}dd`:"#1e293b",h.fill(),h.strokeStyle=ve?"#ffffff":ye?"#10b981":X.color,h.lineWidth=ve?2.5:ye?2:1.8,ye?h.setLineDash([3,3]):h.setLineDash([]),h.stroke(),h.setLineDash([]),h.font=ve?"bold 12px monospace":ye?"600 11px monospace":"11px monospace",h.fillStyle=ve?"#ffffff":ye?"#34d399":Ue?"#f1f5f9":"#94a3b8";const he=X.name,Wt=h.measureText(he).width;if(h.fillText(he,X.x-Wt/2,X.y+X.radius+15),ve||Ue||ye||X.isSubNode||xe==="all"){h.font="9px sans-serif",h.fillStyle=ve?X.color:ye?"#10b981":X.isSubNode?"#c084fc":"rgba(255, 255, 255, 0.6)";const gt=ve?"ACTIVE FOCUS":ye?"IMPORTS":X.isInbound?"CALLS THIS":X.isOutbound?"INVOKED BY THIS":X.isSubNode?X.kind?X.kind.toUpperCase():"SUB-NODE":X.kind?X.kind.toUpperCase():"NODE",Et=h.measureText(gt).width;h.fillText(gt,X.x-Et/2,X.y-X.radius-6)}}),h.restore(),Z&&(C+=1),D=requestAnimationFrame(Ta)};return Ta(),()=>{cancelAnimationFrame(D),tn.disconnect(),Q.removeEventListener("mousedown",tu),window.removeEventListener("mousemove",ei),window.removeEventListener("mouseup",ln),Q.removeEventListener("wheel",an)}},[d,v,N,y,A,xe,ie,Z,Ne,Fe]),u.jsxs("div",{className:"graph2d-page-layout",children:[u.jsxs("aside",{className:"graph2d-left-panel",children:[u.jsxs("div",{className:"panel-header",children:[u.jsxs("div",{className:"flex items-center gap-2",children:[u.jsx("span",{className:"material-symbols-outlined text-primary text-base",children:"hub"}),u.jsx("span",{className:"panel-title",children:"Graph Explorer"})]}),u.jsxs("span",{className:"text-xs text-outline",children:[d.nodes.length," nodes"]})]}),u.jsxs("div",{className:"panel-scrollable",children:[u.jsxs("div",{className:"filter-section",children:[u.jsxs("div",{className:"search-box",children:[u.jsx("span",{className:"material-symbols-outlined text-xs text-outline",children:"search"}),u.jsx("input",{type:"text",placeholder:"Find symbol...",value:F,onChange:Q=>J(Q.target.value),className:"search-input"}),F&&u.jsx("button",{className:"clear-btn",onClick:()=>J(""),children:"✕"})]}),ze.length>0&&u.jsx("div",{className:"search-dropdown",children:ze.map(Q=>u.jsxs("div",{className:"search-item",onClick:()=>{T(Q),J(""),ce()},children:[u.jsx("span",{className:"font-semibold text-primary truncate",children:Q.name}),u.jsx("span",{className:"text-[10px] text-outline truncate",children:Q.file_path})]},Q.id))})]}),u.jsxs("div",{className:"filter-section",children:[u.jsx("span",{className:"filter-title",children:"Neighborhood Depth"}),u.jsxs("div",{className:"hop-pill-group",children:[u.jsx("button",{className:`hop-pill ${xe===1?"hop-pill-active":""}`,onClick:()=>{I(1),je(1),Ee({x:0,y:0})},children:"1-Hop"}),u.jsx("button",{className:`hop-pill ${xe===2?"hop-pill-active":""}`,onClick:()=>{I(2),je(.85),Ee({x:0,y:0})},children:"2-Hop"}),u.jsx("button",{className:`hop-pill ${xe==="all"?"hop-pill-active":""}`,onClick:()=>{I("all"),je(.68),Ee({x:0,y:0}),re("all")},children:"All"})]})]}),u.jsxs("div",{className:"filter-section",children:[u.jsx("span",{className:"filter-title",children:"Edge Filters"}),u.jsxs("div",{className:"flex flex-col gap-2 mt-2",children:[u.jsxs("label",{className:"filter-row",children:[u.jsx("input",{type:"checkbox",checked:ie.CALLS,onChange:Q=>He({...ie,CALLS:Q.target.checked}),className:"accent-sky-500"}),u.jsx("span",{className:"color-dot bg-sky-400"}),u.jsx("span",{className:"filter-label",children:"Calls"}),u.jsx("span",{className:"filter-count text-sky-400",children:ue.CALLS||0})]}),u.jsxs("label",{className:"filter-row",children:[u.jsx("input",{type:"checkbox",checked:ie.IMPORTS,onChange:Q=>He({...ie,IMPORTS:Q.target.checked}),className:"accent-emerald-500"}),u.jsx("span",{className:"color-dot bg-emerald-400"}),u.jsx("span",{className:"filter-label",children:"Imports"}),u.jsx("span",{className:"filter-count text-emerald-400",children:ue.IMPORTS||0})]}),u.jsxs("label",{className:"filter-row",children:[u.jsx("input",{type:"checkbox",checked:ie.DEFINES,onChange:Q=>He({...ie,DEFINES:Q.target.checked}),className:"accent-purple-500"}),u.jsx("span",{className:"color-dot bg-purple-400"}),u.jsx("span",{className:"filter-label",children:"Defines"}),u.jsx("span",{className:"filter-count text-purple-400",children:ue.DEFINES||0})]}),u.jsxs("label",{className:"filter-row",children:[u.jsx("input",{type:"checkbox",checked:ie.SIMILAR_TO,onChange:Q=>He({...ie,SIMILAR_TO:Q.target.checked}),className:"accent-pink-500"}),u.jsx("span",{className:"color-dot bg-pink-400"}),u.jsx("span",{className:"filter-label",children:"Similar To"}),u.jsx("span",{className:"filter-count text-pink-400",children:ue.SIMILAR_TO||0})]})]})]}),u.jsxs("div",{className:"filter-section",children:[u.jsx("span",{className:"filter-title",children:"Communities (Louvain)"}),u.jsx("div",{className:"flex flex-col gap-1.5 mt-2",children:(d.communities||[]).slice(0,6).map(Q=>u.jsxs("div",{className:"community-item",onClick:()=>{const fe=d.nodes.find(h=>h.comm===Q.id);fe&&(T(fe),ce())},children:[u.jsxs("div",{className:"flex items-center gap-2 truncate",children:[u.jsx("span",{className:"w-2.5 h-2.5 rounded-full flex-shrink-0",style:{backgroundColor:Q.color}}),u.jsx("span",{className:"text-xs truncate",children:Q.name})]}),u.jsx("span",{className:"text-[10px] text-outline font-mono",children:Q.count})]},Q.id))})]})]})]}),u.jsxs("main",{ref:m,className:"graph2d-viewport",children:[u.jsx("canvas",{ref:c,className:"graph2d-canvas"}),u.jsxs("div",{className:"canvas-hud",children:[u.jsxs("div",{className:"hud-metric-pill",children:[u.jsx("span",{className:"w-2 h-2 rounded-full bg-emerald-400 animate-pulse"}),u.jsx("span",{className:"text-xs font-semibold text-white",children:"2D Code Graph"}),u.jsxs("span",{className:"text-xs text-outline font-mono",children:[d.total_nodes??d.nodes.length," Nodes • ",d.total_edges??d.edges.length," Edges"]}),U&&u.jsxs("span",{className:"text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded flex items-center gap-1.5",children:[u.jsx("span",{children:"Sample Mode (Backend Offline)"}),u.jsx("button",{onClick:()=>{$e.getGlobeTopology({maxNodes:200}).then(Q=>{var fe;(fe=Q==null?void 0:Q.nodes)!=null&&fe.length&&(p(Q),T(Q.nodes[0]),k(!1))})},className:"underline hover:text-white font-semibold cursor-pointer",title:"Retry fetching live topology",children:"Retry"})]})]}),u.jsxs("div",{className:"hud-actions",children:[u.jsxs("button",{className:"hud-btn",onClick:()=>Be(!Z),title:"Toggle edge particle flow animation",children:[u.jsx("span",{className:"material-symbols-outlined text-sm",children:Z?"pause":"play_arrow"}),u.jsx("span",{children:Z?"Pause":"Play"})]}),u.jsxs("button",{className:"hud-btn",onClick:ce,title:"Recenter graph view",children:[u.jsx("span",{className:"material-symbols-outlined text-sm",children:"center_focus_strong"}),u.jsx("span",{children:"Recenter"})]})]})]}),u.jsxs("div",{className:"canvas-hint",children:[u.jsx("span",{className:"material-symbols-outlined text-xs text-primary",children:"mouse"}),u.jsx("span",{children:"Click node to focus callers/callees • Drag node to rearrange • Scroll to zoom • Drag background to pan"})]})]}),u.jsxs("aside",{className:"graph2d-right-panel",children:[u.jsxs("div",{className:"panel-header",children:[u.jsx("span",{className:"panel-title",children:"Symbol Inspector"}),u.jsx("span",{className:"kind-badge uppercase",children:v.kind||"SYMBOL"})]}),u.jsxs("div",{className:"panel-scrollable",children:[u.jsxs("div",{className:"inspector-card",children:[u.jsx("div",{className:"text-sm font-bold font-mono text-white break-all",children:v.name}),u.jsxs("div",{className:"text-xs font-mono text-outline mt-1 break-all",children:[v.file_path,":",v.start_line||1]}),u.jsxs("div",{className:"grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-[var(--hairline)]",children:[u.jsxs("div",{className:"stat-box",children:[u.jsx("span",{className:"stat-label",children:"In-Degree"}),u.jsx("span",{className:"stat-val text-sky-400 font-mono",children:v.in_degree||N.length})]}),u.jsxs("div",{className:"stat-box",children:[u.jsx("span",{className:"stat-label",children:"Out-Degree"}),u.jsx("span",{className:"stat-val text-purple-400 font-mono",children:v.out_degree||y.length})]})]}),u.jsxs("div",{className:"mt-3 text-xs flex items-center justify-between text-outline",children:[u.jsx("span",{children:"Subsystem:"}),u.jsx("span",{className:"font-semibold text-primary",children:v.comm_name||"Core"})]})]}),u.jsxs("div",{className:"edge-group-section",children:[u.jsxs("div",{className:"flex items-center justify-between mb-2",children:[u.jsxs("span",{className:"text-xs font-semibold text-sky-400",children:["Inbound Callers (",N.length,")"]}),u.jsx("span",{className:"text-[10px] text-outline font-mono",children:"SQLite Edges"})]}),q?u.jsx("div",{className:"text-xs text-outline py-2",children:"Loading callers..."}):N.length>0?u.jsx("div",{className:"flex flex-col gap-1.5",children:N.map((Q,fe)=>{const h=Q.caller||"caller";return u.jsx("div",{className:"edge-node-row",onClick:()=>{const D=d.nodes.find(C=>C.name===h||C.id===h);D?(T(D),ce()):o==null||o(h,Q.file_path)},title:`Focus ${h}`,children:u.jsxs("div",{className:"truncate",children:[u.jsxs("span",{className:"text-xs font-mono text-sky-300 font-semibold truncate block",children:["← ",h]}),u.jsxs("span",{className:"text-[10px] text-outline truncate block",children:[Q.file_path?Q.file_path.split("/").pop():"",":",Q.line_number||1]})]})},fe)})}):u.jsx("div",{className:"text-xs text-outline italic py-1",children:"No inbound callers recorded"})]}),u.jsxs("div",{className:"edge-group-section",children:[u.jsxs("div",{className:"flex items-center justify-between mb-2",children:[u.jsxs("span",{className:"text-xs font-semibold text-purple-400",children:["Outbound Callees (",y.length,")"]}),u.jsx("span",{className:"text-[10px] text-outline font-mono",children:"SQLite Edges"})]}),q?u.jsx("div",{className:"text-xs text-outline py-2",children:"Loading callees..."}):y.length>0?u.jsx("div",{className:"flex flex-col gap-1.5",children:y.map((Q,fe)=>{const h=Q.callee||"callee";return u.jsx("div",{className:"edge-node-row",onClick:()=>{const D=d.nodes.find(C=>C.name===h||C.id===h);D?(T(D),ce()):o==null||o(h,Q.file_path)},title:`Focus ${h}`,children:u.jsxs("div",{className:"truncate",children:[u.jsxs("span",{className:"text-xs font-mono text-purple-300 font-semibold truncate block",children:["→ ",h]}),u.jsxs("span",{className:"text-[10px] text-outline truncate block",children:[Q.file_path?Q.file_path.split("/").pop():"",":",Q.line_number||1]})]})},fe)})}):u.jsx("div",{className:"text-xs text-outline italic py-1",children:"No outbound callees recorded"})]}),u.jsxs("div",{className:"edge-group-section",children:[u.jsxs("div",{className:"flex items-center justify-between mb-2",children:[u.jsxs("span",{className:"text-xs font-semibold text-emerald-400",children:["Imported Dependencies (",A.length,")"]}),u.jsx("span",{className:"text-[10px] text-outline font-mono",children:"Imports Table"})]}),q?u.jsx("div",{className:"text-xs text-outline py-2",children:"Loading imports..."}):A.length>0?u.jsx("div",{className:"flex flex-col gap-1.5 max-h-[190px] overflow-y-auto pr-1",children:A.map((Q,fe)=>{const h=Q.name?`${Q.name} (${Q.module})`:Q.module;return u.jsx("div",{className:"edge-node-row edge-node-row-import",onClick:()=>{const D=d.nodes.find(C=>C.name===(Q.name||Q.module)||C.name===Q.module);D?(T(D),ce()):o==null||o(Q.name||Q.module,Q.file_path)},title:`Inspect ${h}`,children:u.jsxs("div",{className:"truncate",children:[u.jsxs("span",{className:"text-xs font-mono text-emerald-300 font-semibold truncate block",children:["⇲ ",h]}),u.jsxs("span",{className:"text-[10px] text-outline truncate block",children:[Q.file_path?Q.file_path.split("/").pop():"",":",Q.line_number||1]})]})},fe)})}):u.jsx("div",{className:"text-xs text-outline italic py-1",children:"No imports recorded for this symbol"})]}),u.jsxs("div",{className:"mt-auto pt-4 flex flex-col gap-2",children:[u.jsxs("button",{className:"action-btn action-btn-primary",onClick:()=>o==null?void 0:o(v.name,v.file_path),children:[u.jsx("span",{className:"material-symbols-outlined text-sm",children:"code"}),u.jsx("span",{children:"Open in Code Explorer"})]}),u.jsxs("button",{className:"action-btn action-btn-secondary",onClick:nt,children:[u.jsx("span",{className:"material-symbols-outlined text-sm",children:"content_copy"}),u.jsx("span",{children:ee?"Copied Bundle!":"Copy LLM Evidence Bundle"})]})]})]})]}),u.jsx("style",{children:`
        .graph2d-page-layout {
          position: relative;
          width: 100%;
          height: calc(100vh - 56px);
          display: flex;
          background: #080b11;
          color: var(--on-surface);
          overflow: hidden;
        }

        /* 1. Left Panel */
        .graph2d-left-panel {
          width: 280px;
          flex-shrink: 0;
          height: 100%;
          background: var(--surface-low);
          border-right: 1px solid var(--hairline);
          display: flex;
          flex-direction: column;
          z-index: 20;
        }
        .panel-header {
          height: 48px;
          padding: 0 16px;
          border-bottom: 1px solid var(--hairline);
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: var(--surface);
          flex-shrink: 0;
        }
        .panel-title {
          font-size: 13px;
          font-weight: 700;
          letter-spacing: -0.01em;
        }
        .panel-scrollable {
          flex: 1;
          min-width: 0;
          width: 100%;
          overflow-y: auto;
          overflow-x: hidden;
          padding: 14px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .filter-section {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .filter-title {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--outline);
        }

        /* Search */
        .search-box {
          position: relative;
          display: flex;
          align-items: center;
          background: var(--surface);
          border: 1px solid var(--hairline);
          border-radius: 6px;
          padding: 6px 8px;
          gap: 6px;
        }
        .search-input {
          background: transparent;
          border: none;
          color: var(--on-surface);
          font-size: 12px;
          outline: none;
          width: 100%;
        }
        .clear-btn {
          color: var(--outline);
          font-size: 11px;
          cursor: pointer;
          background: none;
          border: none;
        }
        .search-dropdown {
          margin-top: 4px;
          background: var(--surface);
          border: 1px solid var(--hairline);
          border-radius: 6px;
          max-height: 180px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
        }
        .search-item {
          padding: 6px 10px;
          cursor: pointer;
          border-bottom: 1px solid var(--hairline);
          display: flex;
          flex-direction: column;
          transition: background 0.15s;
        }
        .search-item:hover {
          background: var(--surface-high);
        }

        /* Hop Pills */
        .hop-pill-group {
          display: flex;
          background: var(--surface);
          border: 1px solid var(--hairline);
          border-radius: 6px;
          padding: 2px;
          gap: 2px;
        }
        .hop-pill {
          flex: 1;
          padding: 4px 8px;
          font-size: 11px;
          font-weight: 600;
          border-radius: 4px;
          background: transparent;
          border: none;
          color: var(--outline);
          cursor: pointer;
          transition: all 0.15s;
        }
        .hop-pill-active {
          background: var(--primary);
          color: #080b11;
        }

        /* Filter Rows */
        .filter-row {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          cursor: pointer;
          padding: 2px 0;
        }
        .color-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .filter-label {
          flex: 1;
          color: var(--on-surface);
        }
        .filter-count {
          font-family: var(--font-mono);
          font-size: 11px;
        }

        /* Community rows */
        .community-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 5px 8px;
          border-radius: 4px;
          background: var(--surface);
          cursor: pointer;
          transition: background 0.15s;
        }
        .community-item:hover {
          background: var(--surface-high);
        }

        /* 2. Center Canvas Viewport */
        .graph2d-viewport {
          position: relative;
          flex: 1;
          height: 100%;
          background: #080b11;
          overflow: hidden;
        }
        .graph2d-canvas {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          touch-action: none;
        }
        .canvas-hud {
          position: absolute;
          top: 14px;
          left: 18px;
          right: 18px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          pointer-events: none;
          z-index: 10;
        }
        .hud-metric-pill {
          pointer-events: auto;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 14px;
          background: rgba(15, 23, 42, 0.85);
          border: 1px solid var(--hairline);
          border-radius: 20px;
          backdrop-filter: blur(8px);
        }
        .hud-actions {
          pointer-events: auto;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .hud-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          background: rgba(15, 23, 42, 0.85);
          border: 1px solid var(--hairline);
          border-radius: 6px;
          color: var(--on-surface);
          font-size: 12px;
          cursor: pointer;
          backdrop-filter: blur(8px);
          transition: background 0.15s;
        }
        .hud-btn:hover {
          background: var(--surface-high);
        }
        .canvas-hint {
          position: absolute;
          bottom: 14px;
          left: 18px;
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 5px 12px;
          background: rgba(15, 23, 42, 0.85);
          border: 1px solid var(--hairline);
          border-radius: 6px;
          font-size: 11px;
          color: var(--outline);
          backdrop-filter: blur(8px);
          pointer-events: none;
          z-index: 10;
        }

        /* 3. Right Inspector Panel */
        .graph2d-right-panel {
          width: 320px;
          flex-shrink: 0;
          height: 100%;
          background: var(--surface-low);
          border-left: 1px solid var(--hairline);
          display: flex;
          flex-direction: column;
          z-index: 20;
        }
        .kind-badge {
          font-family: var(--font-mono);
          font-size: 10px;
          font-weight: 600;
          padding: 2px 6px;
          border-radius: 4px;
          background: rgba(56, 189, 248, 0.15);
          color: #38bdf8;
          border: 1px solid rgba(56, 189, 248, 0.3);
        }
        .inspector-card {
          background: var(--surface);
          border: 1px solid var(--hairline);
          border-radius: 8px;
          padding: 12px;
        }
        .stat-box {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .stat-label {
          font-size: 10px;
          text-transform: uppercase;
          color: var(--outline);
        }
        .stat-val {
          font-size: 14px;
          font-weight: 700;
        }
        .edge-group-section {
          background: var(--surface);
          border: 1px solid var(--hairline);
          border-radius: 8px;
          padding: 12px;
        }
        .edge-node-row {
          min-width: 0;
          max-width: 100%;
          overflow: hidden;
          padding: 6px 8px;
          border-radius: 4px;
          background: var(--surface-lowest);
          border: 1px solid var(--hairline);
          cursor: pointer;
          transition: all 0.15s;
        }
        .edge-node-row > div,
        .edge-node-row span {
          min-width: 0;
          max-width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .inspector-card,
        .edge-group-section {
          min-width: 0;
          max-width: 100%;
          overflow: hidden;
        }
        .inspector-card > div,
        .edge-group-section > div {
          min-width: 0;
          max-width: 100%;
        }
        .edge-node-row:hover {
          background: var(--surface-high);
          border-color: rgba(56, 189, 248, 0.4);
        }
        .edge-node-row-import:hover {
          background: rgba(16, 185, 129, 0.08);
          border-color: rgba(16, 185, 129, 0.4);
        }
        .action-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 9px 12px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          border: none;
          transition: all 0.15s;
        }
        .action-btn-primary {
          background: var(--primary);
          color: #080b11;
        }
        .action-btn-primary:hover {
          filter: brightness(1.1);
        }
        .action-btn-secondary {
          background: var(--surface);
          color: var(--on-surface);
          border: 1px solid var(--hairline);
        }
        .action-btn-secondary:hover {
          background: var(--surface-high);
        }

        @media (max-width: 1200px) {
          .graph2d-left-panel {
            width: 196px;
          }
          .graph2d-right-panel {
            width: 320px;
          }
          .hud-metric-pill {
            max-width: 142px;
          }
          .hud-metric-pill > .text-outline {
            display: none;
          }
          .hud-actions {
            gap: 4px;
          }
          .hud-btn {
            padding: 6px 8px;
          }
        }

        @media (max-width: 980px) {
          .graph2d-left-panel {
            width: 64px;
          }
          .graph2d-left-panel .panel-header,
          .graph2d-left-panel .panel-scrollable {
            display: none;
          }
          .graph2d-right-panel {
            width: 280px;
          }
          .hud-btn span:last-child {
            display: none;
          }
        }
      `})]})},Dy=({health:s,apiError:o,onRefreshGlobal:m})=>{var J,xe,I,ie,He,Z,Be,Ne,Ee,Fe,je,K,re,ue,ze,ce,nt,Q,fe;const[c,d]=b.useState(s||null),[p,v]=b.useState(null),[T,N]=b.useState(o||null),[z,y]=b.useState(!1),[g,A]=b.useState(!1),[B,U]=b.useState(null),k=async()=>{y(!0),N(null);try{const[h,D]=await Promise.all([$e.getHealth(),$e.getDiagnostics()]);d(h),v(D),m==null||m()}catch(h){N((h==null?void 0:h.message)||"Failed to reach FastAST API server on port 4200."),d(null)}finally{y(!1)}};b.useEffect(()=>{k()},[]);const q=async h=>{A(!0),N(null);try{const D=await $e.triggerReindex(h);U(D.summary),d(D.health);const C=await $e.getDiagnostics();v(C),m==null||m()}catch(D){N((D==null?void 0:D.message)||"Indexing failed.")}finally{A(!1)}},Y=!!(c!=null&&c.ok&&!T),ee=(J=p==null?void 0:p.database)!=null&&J.size_bytes?(p.database.size_bytes/1024).toFixed(1):"—",le=c!=null&&c.last_index_time?new Date(c.last_index_time).toLocaleString():"Not indexed yet",F=p?[{name:"Backend HTTP API Bridge (:4200)",status:Y?"PASS":"FAIL",detail:Y?`Reachable at http://127.0.0.1:4200 • Repo: ${c==null?void 0:c.repo_path}`:T||"API unreachable"},{name:"SQLite 3 WAL Journal & Integrity",status:(xe=p.database)!=null&&xe.integrity_ok?"PASS":"WARN",detail:`Journal: ${((I=p.database)==null?void 0:I.journal_mode)||"wal"} • Integrity: ${((ie=p.database)==null?void 0:ie.integrity_message)||"ok"} • Size: ${ee} KB`},{name:"Schema Version & Migrations",status:((He=p.database)==null?void 0:He.schema_version)===((Z=p.database)==null?void 0:Z.expected_schema_version)?"PASS":"WARN",detail:`Schema v${((Be=p.database)==null?void 0:Be.schema_version)??"—"} (expected v${((Ne=p.database)==null?void 0:Ne.expected_schema_version)??10})`},{name:"Process Lock State",status:(Ee=p.lock)!=null&&Ee.is_stale?"WARN":"PASS",detail:`Locked: ${(Fe=p.lock)!=null&&Fe.is_locked?"Yes":"No (Idle)"} • Stale Lock: ${(je=p.lock)!=null&&je.is_stale?"Yes":"No"}`},{name:"FTS5 BM25 Lexical Index",status:(((K=p.coverage)==null?void 0:K.fts_entries_count)??0)>0?"PASS":"WARN",detail:`${(((re=p.coverage)==null?void 0:re.fts_entries_count)??0).toLocaleString()} FTS5 rows indexed for BM25 retrieval`},{name:"Dense Semantic Embeddings",status:(((ue=p.coverage)==null?void 0:ue.embeddings_count)??0)>0?"PASS":"WARN",detail:`${(((ze=p.coverage)==null?void 0:ze.embeddings_count)??0).toLocaleString()} symbol vector embeddings stored`},{name:"Louvain Community Partitioning",status:(((ce=p.coverage)==null?void 0:ce.communities_count)??0)>0?"PASS":"WARN",detail:`${(((nt=p.coverage)==null?void 0:nt.communities_count)??0).toLocaleString()} distinct communities detected`}]:[];return u.jsxs("div",{className:"system-page",children:[u.jsxs("div",{className:"system-header",children:[u.jsxs("div",{children:[u.jsx("h1",{className:"system-title",children:"System Health & Index Control"}),u.jsx("p",{className:"system-subtitle",children:"Live API connectivity, SQLite WAL database status, entity counts, and re-index controls"})]}),u.jsxs("div",{className:"header-actions",children:[u.jsxs("button",{className:"btn-secondary",onClick:k,disabled:z,children:[u.jsx("span",{className:`material-symbols-outlined text-sm ${z?"spin-icon":""}`,children:"sync"}),u.jsx("span",{children:z?"Checking...":"Run Doctor Check"})]}),u.jsxs("button",{className:"btn-secondary",onClick:()=>q(!1),disabled:g||!Y,children:[u.jsx("span",{className:`material-symbols-outlined text-sm ${g?"spin-icon":""}`,children:"refresh"}),u.jsx("span",{children:g?"Indexing...":"Incremental Re-index"})]}),u.jsxs("button",{className:"btn-primary",onClick:()=>q(!0),disabled:g||!Y,children:[u.jsx("span",{className:"material-symbols-outlined text-sm",children:"bolt"}),u.jsx("span",{children:"Force Full Re-index"})]})]})]}),u.jsxs("div",{className:"system-body",children:[T&&u.jsxs("div",{className:"api-error-banner",children:[u.jsxs("div",{children:[u.jsx("strong",{children:"API Connection Error:"})," ",T]}),u.jsx("button",{className:"api-retry-btn",onClick:k,children:"Retry"})]}),u.jsxs("div",{className:"status-cards-grid",children:[u.jsxs("div",{className:"status-card",children:[u.jsx("span",{className:"card-label",children:"API Reachable"}),u.jsx("div",{className:"card-value-row",children:u.jsx("span",{className:`status-indicator ${Y?"indicator-yes":"indicator-no"}`,children:Y?"YES (ONLINE)":"NO (OFFLINE)"})}),u.jsx("span",{className:"card-sub font-code",children:"http://127.0.0.1:4200/api/health"})]}),u.jsxs("div",{className:"status-card",children:[u.jsx("span",{className:"card-label",children:"SQLite Database Path"}),u.jsx("span",{className:"card-val-mono font-code truncate",title:(c==null?void 0:c.db_path)||"",children:(c==null?void 0:c.db_path)||"Not connected"}),u.jsxs("span",{className:"card-sub font-code",children:["Exists: ",c!=null&&c.db_exists?`Yes (${ee} KB)`:"No"]})]}),u.jsxs("div",{className:"status-card",children:[u.jsx("span",{className:"card-label",children:"Last Index Timestamp"}),u.jsx("span",{className:"card-val-mono font-code",children:le}),u.jsxs("span",{className:"card-sub",children:["Status: ",u.jsx("strong",{className:"text-tertiary",children:((Q=c==null?void 0:c.status)==null?void 0:Q.toUpperCase())||"—"})]})]}),u.jsxs("div",{className:"status-card",children:[u.jsx("span",{className:"card-label",children:"Live Indexed Counts"}),u.jsxs("div",{className:"counts-inline font-code",children:[u.jsxs("span",{children:[u.jsx("strong",{className:"text-on-surface",children:(c==null?void 0:c.file_count)??"—"})," files"]}),u.jsx("span",{children:"•"}),u.jsxs("span",{children:[u.jsx("strong",{className:"text-primary",children:(c==null?void 0:c.symbol_count)??"—"})," symbols"]}),u.jsx("span",{children:"•"}),u.jsxs("span",{children:[u.jsx("strong",{className:"text-tertiary",children:(c==null?void 0:c.edge_count)??"—"})," edges"]})]}),u.jsxs("span",{className:"card-sub font-code",children:[(c==null?void 0:c.call_count)??"—"," calls • ",(c==null?void 0:c.import_count)??"—"," imports"]})]})]}),B&&u.jsx("div",{className:"reindex-banner font-code",children:u.jsxs("div",{className:"flex items-center gap-2 text-tertiary font-semibold",children:[u.jsx("span",{className:"material-symbols-outlined text-sm",children:"check_circle"}),u.jsxs("span",{children:["Re-index completed in ",B.elapsed_ms," ms — ",B.indexed_files," indexed,"," ",B.skipped_files," unchanged, ",B.total_symbols," symbols,"," ",B.total_edges," edges."]})]})}),u.jsxs("div",{className:"diagnostics-card",children:[u.jsxs("div",{className:"card-header-row",children:[u.jsx("span",{className:"table-title font-code",children:"FastAST Doctor Subsystem Checks"}),u.jsxs("span",{className:"font-code text-xs text-outline",children:["Overall: ",((fe=p==null?void 0:p.status)==null?void 0:fe.toUpperCase())||(Y?"HEALTHY":"OFFLINE")]})]}),F.length>0?u.jsx("div",{className:"diag-list",children:F.map((h,D)=>u.jsxs("div",{className:"diag-row",children:[u.jsxs("div",{className:"diag-row-left",children:[u.jsx("span",{className:`material-symbols-outlined text-sm ${h.status==="PASS"?"text-tertiary":h.status==="WARN"?"text-amber":"text-error"}`,children:h.status==="PASS"?"check_circle":h.status==="WARN"?"warning":"error"}),u.jsxs("div",{className:"diag-text-col",children:[u.jsx("span",{className:"diag-name",children:h.name}),u.jsx("span",{className:"diag-detail font-code",children:h.detail})]})]}),u.jsx("span",{className:`diag-badge font-code ${h.status==="PASS"?"badge-pass":h.status==="WARN"?"badge-warn":"badge-fail"}`,children:h.status})]},D))}):u.jsx("div",{className:"empty-diag font-code",children:z?"Running repository diagnostics...":"No diagnostic report available (API offline)."})]}),(p==null?void 0:p.recommendations)&&p.recommendations.length>0&&u.jsxs("div",{className:"recommendations-card font-code",children:[u.jsx("div",{className:"rec-title",children:"Doctor Recommendations:"}),p.recommendations.map((h,D)=>u.jsxs("div",{className:"rec-item",children:["• ",h]},D))]})]}),u.jsx("style",{children:`
        .system-page {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          background: var(--surface-lowest);
          overflow-y: auto;
        }
        .system-header {
          padding: 14px 20px;
          background: var(--surface);
          border-bottom: 1px solid var(--hairline);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
        }
        .system-title {
          font-size: 15px;
          font-weight: 700;
          color: var(--on-surface);
          margin: 0;
        }
        .system-subtitle {
          font-size: 12px;
          color: var(--outline);
          margin: 2px 0 0 0;
        }
        .header-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .btn-secondary, .btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 5px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          border: 1px solid var(--hairline);
        }
        .btn-secondary {
          background: var(--surface-container);
          color: var(--on-surface);
        }
        .btn-secondary:hover:not(:disabled) {
          background: var(--surface-high);
        }
        .btn-primary {
          background: var(--primary);
          color: var(--on-primary);
          border-color: transparent;
        }
        .btn-primary:hover:not(:disabled) {
          opacity: 0.92;
        }
        .btn-secondary:disabled, .btn-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .system-body {
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          max-width: 1280px;
          width: 100%;
          margin: 0 auto;
        }
        .status-cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 12px;
        }
        .status-card {
          background: var(--surface);
          border: 1px solid var(--hairline);
          border-radius: 6px;
          padding: 14px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          min-width: 0;
        }
        .card-label {
          font-family: var(--font-mono);
          font-size: 10px;
          text-transform: uppercase;
          color: var(--outline);
          letter-spacing: 0.05em;
        }
        .card-value-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .status-indicator {
          font-family: var(--font-mono);
          font-size: 13px;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 4px;
        }
        .indicator-yes {
          background: rgba(16, 185, 129, 0.15);
          color: var(--tertiary-light);
        }
        .indicator-no {
          background: rgba(244, 63, 94, 0.2);
          color: var(--error-light);
        }
        .card-val-mono {
          font-size: 12.5px;
          font-weight: 600;
          color: var(--on-surface);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .counts-inline {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12.5px;
          color: var(--outline);
        }
        .card-sub {
          font-size: 11px;
          color: var(--outline);
        }
        .reindex-banner {
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.35);
          padding: 10px 14px;
          border-radius: 6px;
          font-size: 12px;
        }
        .diagnostics-card {
          background: var(--surface);
          border: 1px solid var(--hairline);
          border-radius: 6px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .card-header-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .table-title {
          font-size: 11px;
          text-transform: uppercase;
          color: var(--outline);
          font-weight: 600;
        }
        .diag-list {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .diag-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 12px;
          background: var(--surface-low);
          border: 1px solid var(--hairline);
          border-radius: 5px;
          gap: 12px;
        }
        .diag-row-left {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
        }
        .diag-text-col {
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
        }
        .diag-name {
          font-size: 12.5px;
          font-weight: 600;
          color: var(--on-surface);
        }
        .diag-detail {
          font-size: 11px;
          color: var(--outline);
        }
        .diag-badge {
          font-size: 10.5px;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 3px;
          flex-shrink: 0;
        }
        .badge-pass {
          background: rgba(16, 185, 129, 0.14);
          color: var(--tertiary-light);
        }
        .badge-warn {
          background: rgba(245, 158, 11, 0.16);
          color: var(--amber);
        }
        .badge-fail {
          background: rgba(244, 63, 94, 0.2);
          color: var(--error-light);
        }
        .empty-diag {
          padding: 24px;
          text-align: center;
          color: var(--outline);
          font-size: 12px;
        }
        .recommendations-card {
          background: var(--surface);
          border: 1px solid var(--hairline);
          border-radius: 6px;
          padding: 14px;
          font-size: 12px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .rec-title {
          color: var(--amber);
          font-weight: 700;
          margin-bottom: 4px;
        }
        .rec-item {
          color: var(--on-surface-variant);
        }
      `})]})},Uy=()=>{const s=ja(),[o,m]=b.useState(null),[c,d]=b.useState(null),[p,v]=b.useState(null),[T,N]=b.useState(!1),[z,y]=b.useState(!1),[g,A]=b.useState(0),B=b.useCallback(async()=>{y(!0);try{const[Y,ee]=await Promise.all([$e.getHealth(),$e.getStats()]);d(Y),m(ee),v(null),A(le=>le+1)}catch(Y){v((Y==null?void 0:Y.message)||"Cannot connect to FastAST API Server on http://127.0.0.1:4200.")}finally{y(!1)}},[]);b.useEffect(()=>{B()},[B]),b.useEffect(()=>{if(!p&&c)return;const Y=setInterval(()=>{$e.getHealth().then(()=>{B()}).catch(()=>{})},2500);return()=>clearInterval(Y)},[p,c,B]);const U=Y=>{s(`/evidence?q=${encodeURIComponent(Y)}`)},k=async()=>{N(!0);try{await $e.triggerReindex(!1),await B()}catch(Y){v((Y==null?void 0:Y.message)||"Re-index request failed.")}finally{N(!1)}},q=(Y,ee)=>{const le=new URLSearchParams;ee&&le.set("file",ee),Y&&le.set("symbol",Y),s(`/explore?${le.toString()}`)};return u.jsxs("div",{className:"app-root",children:[u.jsx(_y,{stats:o,health:c,apiError:p,onSearchSubmit:U,onReindex:k,onRetryConnection:B,isReindexing:T,isRetrying:z}),u.jsxs("div",{className:"app-body",children:[u.jsx(jy,{stats:o,health:c,apiError:p}),u.jsxs("div",{className:"app-main-viewport",children:[p&&u.jsx("div",{className:"global-error-strip",children:u.jsxs("div",{className:"api-error-banner",children:[u.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"10px"},children:[u.jsx("span",{className:"material-symbols-outlined text-error",children:"error"}),u.jsxs("div",{children:[u.jsx("strong",{children:"Backend API Unreachable:"})," ",p," Run"," ",u.jsx("code",{children:"fastast serve --port 4200"})," or ",u.jsx("code",{children:"./start_ui.sh"})," from the repository root."]})]}),u.jsxs("button",{className:"api-retry-btn",onClick:B,disabled:z,title:"Retry connection to FastAST API server",children:[u.jsx("span",{className:`material-symbols-outlined text-xs ${z?"animate-spin":""}`,children:z?"sync":"refresh"}),u.jsx("span",{children:z?"Connecting...":"Retry Connection"})]})]})}),u.jsxs(Q0,{children:[u.jsx(Rl,{path:"/",element:u.jsx(xp,{to:"/globe",replace:!0})}),u.jsx(Rl,{path:"/globe",element:u.jsx(My,{stats:o,connectionVersion:g,onNavigateToExplore:q})}),u.jsx(Rl,{path:"/explore",element:u.jsx(Ry,{})}),u.jsx(Rl,{path:"/architecture",element:u.jsx(Ty,{})}),u.jsx(Rl,{path:"/evidence",element:u.jsx(Ay,{})}),u.jsx(Rl,{path:"/coverage",element:u.jsx(zy,{})}),u.jsx(Rl,{path:"/communities",element:u.jsx(Cy,{})}),u.jsx(Rl,{path:"/system",element:u.jsx(Dy,{health:c,apiError:p,onRefreshGlobal:B})}),u.jsx(Rl,{path:"*",element:u.jsx(xp,{to:"/globe",replace:!0})})]})]})]}),u.jsx("style",{children:`
        .app-root {
          width: 100vw;
          height: 100vh;
          display: flex;
          flex-direction: column;
          background: var(--surface-lowest);
          overflow: hidden;
        }
        .app-body {
          flex: 1;
          display: flex;
          overflow: hidden;
          position: relative;
        }
        .app-main-viewport {
          flex: 1;
          height: calc(100vh - 52px);
          overflow: hidden;
          position: relative;
          display: flex;
          flex-direction: column;
        }
        .global-error-strip {
          padding: 10px 16px 0 16px;
          background: var(--surface-lowest);
          z-index: 35;
        }
      `})]})},Ly=()=>u.jsx(hy,{children:u.jsx(Uy,{})});Qv.createRoot(document.getElementById("root")).render(u.jsx(b.StrictMode,{children:u.jsx(Ly,{})}));
