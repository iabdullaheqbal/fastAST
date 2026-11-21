var e=Object.create,t=Object.defineProperty,n=Object.getOwnPropertyDescriptor,r=Object.getOwnPropertyNames,i=Object.getPrototypeOf,a=Object.prototype.hasOwnProperty,o=(e,t)=>()=>(t||(e((t={exports:{}}).exports,t,t.exports),e=null),t.exports),s=(e,i,o,s)=>{if(i&&typeof i==`object`||typeof i==`function`)for(var c=r(i),l=0,u=c.length,d;l<u;l++)d=c[l],!a.call(e,d)&&d!==o&&t(e,d,{get:(e=>i[e]).bind(null,d),enumerable:!(s=n(i,d))||s.enumerable});return e},c=(n,r,o)=>(o=n==null?{}:e(i(n)),s(r||!n||!n.__esModule||!a.call(n,`default`)?t(o,`default`,{value:n,enumerable:!0}):o,n));(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),t.credentials=e.crossOrigin===`use-credentials`?`include`:e.crossOrigin===`anonymous`?`omit`:`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var l=o((e=>{var t=Symbol.for(`react.transitional.element`),n=Symbol.for(`react.portal`),r=Symbol.for(`react.fragment`),i=Symbol.for(`react.strict_mode`),a=Symbol.for(`react.profiler`),o=Symbol.for(`react.consumer`),s=Symbol.for(`react.context`),c=Symbol.for(`react.forward_ref`),l=Symbol.for(`react.suspense`),u=Symbol.for(`react.memo`),d=Symbol.for(`react.lazy`),f=Symbol.for(`react.activity`),p=Symbol.for(`react.view_transition`),m=Symbol.iterator;function h(e){return typeof e!=`object`||!e?null:(e=m&&e[m]||e[`@@iterator`],typeof e==`function`?e:null)}var g={isMounted:function(){return!1},enqueueForceUpdate:function(){},enqueueReplaceState:function(){},enqueueSetState:function(){}},_=Object.assign,v={};function y(e,t,n){this.props=e,this.context=t,this.refs=v,this.updater=n||g}y.prototype.isReactComponent={},y.prototype.setState=function(e,t){if(typeof e!=`object`&&typeof e!=`function`&&e!=null)throw Error(`takes an object of state variables to update or a function which returns an object of state variables.`);this.updater.enqueueSetState(this,e,t,`setState`)},y.prototype.forceUpdate=function(e){this.updater.enqueueForceUpdate(this,e,`forceUpdate`)};function b(){}b.prototype=y.prototype;function x(e,t,n){this.props=e,this.context=t,this.refs=v,this.updater=n||g}var S=x.prototype=new b;S.constructor=x,_(S,y.prototype),S.isPureReactComponent=!0;var C=Array.isArray;function w(){}var T={H:null,A:null,T:null,S:null},E=Object.prototype.hasOwnProperty;function D(e,n,r){var i=r.ref;return{$$typeof:t,type:e,key:n,ref:i===void 0?null:i,props:r}}function O(e,t){return D(e.type,t,e.props)}function k(e){return typeof e==`object`&&!!e&&e.$$typeof===t}function A(e){var t={"=":`=0`,":":`=2`};return`$`+e.replace(/[=:]/g,function(e){return t[e]})}var j=/\/+/g;function M(e,t){return typeof e==`object`&&e&&e.key!=null?A(``+e.key):t.toString(36)}function N(e){switch(e.status){case`fulfilled`:return e.value;case`rejected`:throw e.reason;default:switch(typeof e.status==`string`?e.then(w,w):(e.status=`pending`,e.then(function(t){e.status===`pending`&&(e.status=`fulfilled`,e.value=t)},function(t){e.status===`pending`&&(e.status=`rejected`,e.reason=t)})),e.status){case`fulfilled`:return e.value;case`rejected`:throw e.reason}}throw e}function P(e,r,i,a,o){var s=typeof e;(s===`undefined`||s===`boolean`)&&(e=null);var c=!1;if(e===null)c=!0;else switch(s){case`bigint`:case`string`:case`number`:c=!0;break;case`object`:switch(e.$$typeof){case t:case n:c=!0;break;case d:return c=e._init,P(c(e._payload),r,i,a,o)}}if(c)return o=o(e),c=a===``?`.`+M(e,0):a,C(o)?(i=``,c!=null&&(i=c.replace(j,`$&/`)+`/`),P(o,r,i,``,function(e){return e})):o!=null&&(k(o)&&(o=O(o,i+(o.key==null||e&&e.key===o.key?``:(``+o.key).replace(j,`$&/`)+`/`)+c)),r.push(o)),1;c=0;var l=a===``?`.`:a+`:`;if(C(e))for(var u=0;u<e.length;u++)a=e[u],s=l+M(a,u),c+=P(a,r,i,s,o);else if(u=h(e),typeof u==`function`)for(e=u.call(e),u=0;!(a=e.next()).done;)a=a.value,s=l+M(a,u++),c+=P(a,r,i,s,o);else if(s===`object`){if(typeof e.then==`function`)return P(N(e),r,i,a,o);throw r=String(e),Error(`Objects are not valid as a React child (found: `+(r===`[object Object]`?`object with keys {`+Object.keys(e).join(`, `)+`}`:r)+`). If you meant to render a collection of children, use an array instead.`)}return c}function F(e,t,n){if(e==null)return e;var r=[],i=0;return P(e,r,``,``,function(e){return t.call(n,e,i++)}),r}function I(e){if(e._status===-1){var t=e._result,n=t();n.then(function(t){(e._status===0||e._status===-1)&&(e._status=1,e._result=t,n.status===void 0&&(n.status=`fulfilled`,n.value=t))},function(t){(e._status===0||e._status===-1)&&(e._status=2,e._result=t,n.status===void 0&&(n.status=`rejected`,n.reason=t))}),e._status===-1&&(e._status=0,e._result=n)}if(e._status===1)return e._result.default;throw e._result}var L=typeof reportError==`function`?reportError:function(e){if(typeof window==`object`&&typeof window.ErrorEvent==`function`){var t=new window.ErrorEvent(`error`,{bubbles:!0,cancelable:!0,message:typeof e==`object`&&e&&typeof e.message==`string`?String(e.message):String(e),error:e});if(!window.dispatchEvent(t))return}else if(typeof process==`object`&&typeof process.emit==`function`){process.emit(`uncaughtException`,e);return}console.error(e)};function ee(e){var t=T.T,n={};n.types=t===null?null:t.types,T.T=n;try{var r=e(),i=T.S;i!==null&&i(n,r),typeof r==`object`&&r&&typeof r.then==`function`&&r.then(w,L)}catch(e){L(e)}finally{t!==null&&n.types!==null&&(t.types=n.types),T.T=t}}function te(e){var t=T.T;if(t!==null){var n=t.types;n===null?t.types=[e]:n.indexOf(e)===-1&&n.push(e)}else ee(te.bind(null,e))}var ne={map:F,forEach:function(e,t,n){F(e,function(){t.apply(this,arguments)},n)},count:function(e){var t=0;return F(e,function(){t++}),t},toArray:function(e){return F(e,function(e){return e})||[]},only:function(e){if(!k(e))throw Error(`React.Children.only expected to receive a single React element child.`);return e}};e.Activity=f,e.Children=ne,e.Component=y,e.Fragment=r,e.Profiler=a,e.PureComponent=x,e.StrictMode=i,e.Suspense=l,e.ViewTransition=p,e.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE=T,e.__COMPILER_RUNTIME={__proto__:null,c:function(e){return T.H.useMemoCache(e)}},e.addTransitionType=te,e.cache=function(e){return function(){return e.apply(null,arguments)}},e.cacheSignal=function(){return null},e.cloneElement=function(e,t,n){if(e==null)throw Error(`The argument must be a React element, but you passed `+e+`.`);var r=_({},e.props),i=e.key;if(t!=null)for(a in t.key!==void 0&&(i=``+t.key),t)!E.call(t,a)||a===`key`||a===`__self`||a===`__source`||a===`ref`&&t.ref===void 0||(r[a]=t[a]);var a=arguments.length-2;if(a===1)r.children=n;else if(1<a){for(var o=Array(a),s=0;s<a;s++)o[s]=arguments[s+2];r.children=o}return D(e.type,i,r)},e.createContext=function(e){return e={$$typeof:s,_currentValue:e,_currentValue2:e,_threadCount:0,Provider:null,Consumer:null},e.Provider=e,e.Consumer={$$typeof:o,_context:e},e},e.createElement=function(e,t,n){var r,i={},a=null;if(t!=null)for(r in t.key!==void 0&&(a=``+t.key),t)E.call(t,r)&&r!==`key`&&r!==`__self`&&r!==`__source`&&(i[r]=t[r]);var o=arguments.length-2;if(o===1)i.children=n;else if(1<o){for(var s=Array(o),c=0;c<o;c++)s[c]=arguments[c+2];i.children=s}if(e&&e.defaultProps)for(r in o=e.defaultProps,o)i[r]===void 0&&(i[r]=o[r]);return D(e,a,i)},e.createRef=function(){return{current:null}},e.forwardRef=function(e){return{$$typeof:c,render:e}},e.isValidElement=k,e.lazy=function(e){return{$$typeof:d,_payload:{_status:-1,_result:e},_init:I}},e.memo=function(e,t){return{$$typeof:u,type:e,compare:t===void 0?null:t}},e.startTransition=ee,e.unstable_useCacheRefresh=function(){return T.H.useCacheRefresh()},e.use=function(e){return T.H.use(e)},e.useActionState=function(e,t,n){return T.H.useActionState(e,t,n)},e.useCallback=function(e,t){return T.H.useCallback(e,t)},e.useContext=function(e){return T.H.useContext(e)},e.useDebugValue=function(){},e.useDeferredValue=function(e,t){return T.H.useDeferredValue(e,t)},e.useEffect=function(e,t){return T.H.useEffect(e,t)},e.useEffectEvent=function(e){return T.H.useEffectEvent(e)},e.useId=function(){return T.H.useId()},e.useImperativeHandle=function(e,t,n){return T.H.useImperativeHandle(e,t,n)},e.useInsertionEffect=function(e,t){return T.H.useInsertionEffect(e,t)},e.useLayoutEffect=function(e,t){return T.H.useLayoutEffect(e,t)},e.useMemo=function(e,t){return T.H.useMemo(e,t)},e.useOptimistic=function(e,t){return T.H.useOptimistic(e,t)},e.useReducer=function(e,t,n){return T.H.useReducer(e,t,n)},e.useRef=function(e){return T.H.useRef(e)},e.useState=function(e){return T.H.useState(e)},e.useSyncExternalStore=function(e,t,n){return T.H.useSyncExternalStore(e,t,n)},e.useTransition=function(){return T.H.useTransition()},e.version=`19.3.1`})),u=o(((e,t)=>{t.exports=l()})),d=o((e=>{function t(e,t){var n=e.length;e.push(t);a:for(;0<n;){var r=n-1>>>1,a=e[r];if(0<i(a,t))e[r]=t,e[n]=a,n=r;else break a}}function n(e){return e.length===0?null:e[0]}function r(e){if(e.length===0)return null;var t=e[0],n=e.pop();if(n!==t){e[0]=n;a:for(var r=0,a=e.length,o=a>>>1;r<o;){var s=2*(r+1)-1,c=e[s],l=s+1,u=e[l];if(0>i(c,n))l<a&&0>i(u,c)?(e[r]=u,e[l]=n,r=l):(e[r]=c,e[s]=n,r=s);else if(l<a&&0>i(u,n))e[r]=u,e[l]=n,r=l;else break a}}return t}function i(e,t){var n=e.sortIndex-t.sortIndex;return n===0?e.id-t.id:n}if(e.unstable_now=void 0,typeof performance==`object`&&typeof performance.now==`function`){var a=performance;e.unstable_now=function(){return a.now()}}else{var o=Date,s=o.now();e.unstable_now=function(){return o.now()-s}}var c=[],l=[],u=1,d=null,f=3,p=!1,m=!1,h=!1,g=!1,_=typeof setTimeout==`function`?setTimeout:null,v=typeof clearTimeout==`function`?clearTimeout:null,y=typeof setImmediate<`u`?setImmediate:null;function b(e){for(var i=n(l);i!==null;){if(i.callback===null)r(l);else if(i.startTime<=e)r(l),i.sortIndex=i.expirationTime,t(c,i);else break;i=n(l)}}function x(e){if(h=!1,b(e),!m){if(n(c)!==null)m=!0,S||(S=!0,O());else{var t=n(l);t!==null&&j(x,t.startTime-e)}}}var S=!1,C=-1,w=5,T=-1;function E(){return g?!0:!(e.unstable_now()-T<w)}function D(){if(g=!1,S){var t=e.unstable_now();T=t;var i=!0;try{a:{m=!1,h&&(h=!1,v(C),C=-1),p=!0;var a=f;try{b:{for(b(t),d=n(c);d!==null&&!(d.expirationTime>t&&E());){var o=d.callback;if(typeof o==`function`){d.callback=null,f=d.priorityLevel;var s=o(d.expirationTime<=t);if(t=e.unstable_now(),typeof s==`function`){d.callback=s,b(t),i=!0;break b}d===n(c)&&r(c),b(t)}else r(c);d=n(c)}if(d!==null)i=!0;else{var u=n(l);u!==null&&j(x,u.startTime-t),i=!1}}break a}finally{d=null,f=a,p=!1}i=void 0}}finally{i?O():S=!1}}}var O;if(typeof y==`function`)O=function(){y(D)};else if(typeof MessageChannel<`u`){var k=new MessageChannel,A=k.port2;k.port1.onmessage=D,O=function(){A.postMessage(null)}}else O=function(){_(D,0)};function j(t,n){C=_(function(){t(e.unstable_now())},n)}e.unstable_IdlePriority=5,e.unstable_ImmediatePriority=1,e.unstable_LowPriority=4,e.unstable_NormalPriority=3,e.unstable_Profiling=null,e.unstable_UserBlockingPriority=2,e.unstable_cancelCallback=function(e){e.callback=null},e.unstable_forceFrameRate=function(e){0>e||125<e?console.error(`forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported`):w=0<e?Math.floor(1e3/e):5},e.unstable_getCurrentPriorityLevel=function(){return f},e.unstable_next=function(e){switch(f){case 1:case 2:case 3:var t=3;break;default:t=f}var n=f;f=t;try{return e()}finally{f=n}},e.unstable_requestPaint=function(){g=!0},e.unstable_runWithPriority=function(e,t){switch(e){case 1:case 2:case 3:case 4:case 5:break;default:e=3}var n=f;f=e;try{return t()}finally{f=n}},e.unstable_scheduleCallback=function(r,i,a){var o=e.unstable_now();switch(typeof a==`object`&&a?(a=a.delay,a=typeof a==`number`&&0<a?o+a:o):a=o,r){case 1:var s=-1;break;case 2:s=250;break;case 5:s=1073741823;break;case 4:s=1e4;break;default:s=5e3}return s=a+s,r={id:u++,callback:i,priorityLevel:r,startTime:a,expirationTime:s,sortIndex:-1},a>o?(r.sortIndex=a,t(l,r),n(c)===null&&r===n(l)&&(h?(v(C),C=-1):h=!0,j(x,a-o))):(r.sortIndex=s,t(c,r),m||p||(m=!0,S||(S=!0,O()))),r},e.unstable_shouldYield=E,e.unstable_wrapCallback=function(e){var t=f;return function(){var n=f;f=t;try{return e.apply(this,arguments)}finally{f=n}}}})),f=o(((e,t)=>{t.exports=d()})),p=o((e=>{var t=u();function n(e){var t=`https://react.dev/errors/`+e;if(1<arguments.length){t+=`?args[]=`+encodeURIComponent(arguments[1]);for(var n=2;n<arguments.length;n++)t+=`&args[]=`+encodeURIComponent(arguments[n])}return`Minified React error #`+e+`; visit `+t+` for the full message or use the non-minified dev environment for full errors and additional helpful warnings.`}function r(){}var i={d:{f:r,r:function(){throw Error(n(522))},D:r,C:r,L:r,m:r,X:r,S:r,M:r},p:0,findDOMNode:null},a=Symbol.for(`react.portal`),o=Symbol.for(`react.recoverable`),s=Symbol.for(`react.optimistic_key`);function c(e,t,n){var r=3<arguments.length&&arguments[3]!==void 0?arguments[3]:null;return{$$typeof:a,key:r==null?null:r===s?s:``+r,children:e,containerInfo:t,implementation:n}}var l=t.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;function d(e,t){if(e===`font`)return``;if(typeof t==`string`)return t===`use-credentials`?t:``}e.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE=i,e.browser=function(e){return{$$typeof:o,_reason:e}},e.createPortal=function(e,t){var r=2<arguments.length&&arguments[2]!==void 0?arguments[2]:null;if(!t||t.nodeType!==1&&t.nodeType!==9&&t.nodeType!==11)throw Error(n(299));return c(e,t,null,r)},e.flushSync=function(e){var t=l.T,n=i.p;try{if(l.T=null,i.p=2,e)return e()}finally{l.T=t,i.p=n,i.d.f()}},e.preconnect=function(e,t){typeof e==`string`&&(t?(t=t.crossOrigin,t=typeof t==`string`?t===`use-credentials`?t:``:void 0):t=null,i.d.C(e,t))},e.prefetchDNS=function(e){typeof e==`string`&&i.d.D(e)},e.preinit=function(e,t){if(typeof e==`string`&&t&&typeof t.as==`string`){var n=t.as,r=d(n,t.crossOrigin),a=typeof t.integrity==`string`?t.integrity:void 0,o=typeof t.fetchPriority==`string`?t.fetchPriority:void 0;n===`style`?i.d.S(e,typeof t.precedence==`string`?t.precedence:void 0,{crossOrigin:r,integrity:a,fetchPriority:o}):n===`script`&&i.d.X(e,{crossOrigin:r,integrity:a,fetchPriority:o,nonce:typeof t.nonce==`string`?t.nonce:void 0})}},e.preinitModule=function(e,t){if(typeof e==`string`){if(typeof t==`object`&&t){if(t.as==null||t.as===`script`){var n=d(t.as,t.crossOrigin);i.d.M(e,{crossOrigin:n,integrity:typeof t.integrity==`string`?t.integrity:void 0,nonce:typeof t.nonce==`string`?t.nonce:void 0,fetchPriority:typeof t.fetchPriority==`string`?t.fetchPriority:void 0})}}else t??i.d.M(e)}},e.preload=function(e,t){if(typeof e==`string`&&typeof t==`object`&&t&&typeof t.as==`string`){var n=t.as,r=d(n,t.crossOrigin);i.d.L(e,n,{crossOrigin:r,integrity:typeof t.integrity==`string`?t.integrity:void 0,nonce:typeof t.nonce==`string`?t.nonce:void 0,type:typeof t.type==`string`?t.type:void 0,fetchPriority:typeof t.fetchPriority==`string`?t.fetchPriority:void 0,referrerPolicy:typeof t.referrerPolicy==`string`?t.referrerPolicy:void 0,imageSrcSet:typeof t.imageSrcSet==`string`?t.imageSrcSet:void 0,imageSizes:typeof t.imageSizes==`string`?t.imageSizes:void 0,media:typeof t.media==`string`?t.media:void 0})}},e.preloadModule=function(e,t){if(typeof e==`string`){if(t){var n=d(t.as,t.crossOrigin);i.d.m(e,{as:typeof t.as==`string`&&t.as!==`script`?t.as:void 0,crossOrigin:n,integrity:typeof t.integrity==`string`?t.integrity:void 0,nonce:typeof t.nonce==`string`?t.nonce:void 0,fetchPriority:typeof t.fetchPriority==`string`?t.fetchPriority:void 0})}else i.d.m(e)}},e.requestFormReset=function(e){i.d.r(e)},e.unstable_batchedUpdates=function(e,t){return e(t)},e.useFormState=function(e,t,n){return l.H.useFormState(e,t,n)},e.useFormStatus=function(){return l.H.useHostTransitionStatus()},e.version=`19.3.1`})),m=o(((e,t)=>{function n(){if(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__<`u`&&typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE==`function`)try{__REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(n)}catch(e){console.error(e)}}n(),t.exports=p()})),h=o((e=>{var t=f(),n=u(),r=m();function i(e){var t=`https://react.dev/errors/`+e;if(1<arguments.length){t+=`?args[]=`+encodeURIComponent(arguments[1]);for(var n=2;n<arguments.length;n++)t+=`&args[]=`+encodeURIComponent(arguments[n])}return`Minified React error #`+e+`; visit `+t+` for the full message or use the non-minified dev environment for full errors and additional helpful warnings.`}function a(e){return!(!e||e.nodeType!==1&&e.nodeType!==9&&e.nodeType!==11)}function o(e){for(var t=e,n=t;n&&!n.alternate;)t=n,t.flags&4098&&(e=t.return),n=t.return;for(;t.return;)t=t.return;return t.tag===3?e:null}function s(e){if(e.tag===13){var t=e.memoizedState;if(t===null&&(e=e.alternate,e!==null&&(t=e.memoizedState)),t!==null)return t.dehydrated}return null}function c(e){if(e.tag===31){var t=e.memoizedState;if(t===null&&(e=e.alternate,e!==null&&(t=e.memoizedState)),t!==null)return t.dehydrated}return null}function l(e){if(o(e)!==e)throw Error(i(188))}function d(e){var t=e.alternate;if(!t){if(t=o(e),t===null)throw Error(i(188));return t===e?e:null}for(var n=e,r=t;;){var a=n.return;if(a===null)break;var s=a.alternate;if(s===null){if(r=a.return,r!==null){n=r;continue}break}if(a.child===s.child){for(s=a.child;s;){if(s===n)return l(a),e;if(s===r)return l(a),t;s=s.sibling}throw Error(i(188))}if(n.return!==r.return)n=a,r=s;else{for(var c=!1,u=a.child;u;){if(u===n){c=!0,n=a,r=s;break}if(u===r){c=!0,r=a,n=s;break}u=u.sibling}if(!c){for(u=s.child;u;){if(u===n){c=!0,n=s,r=a;break}if(u===r){c=!0,r=s,n=a;break}u=u.sibling}if(!c)throw Error(i(189))}}if(n.alternate!==r)throw Error(i(190))}if(n.tag!==3)throw Error(i(188));return n.stateNode.current===n?e:t}function p(e){var t=e.tag;if(t===5||t===26||t===27||t===6)return e;for(e=e.child;e!==null;){if(t=p(e),t!==null)return t;e=e.sibling}return null}function h(e,t,n,r,i,a){for(;e!==null;){if((e.tag===5||e.tag===27||e.tag===6)&&n(e,r,i,a)||(e.tag!==22||e.memoizedState===null)&&(t||e.tag!==5&&e.tag!==27)&&h(e.child,t,n,r,i,a))return!0;e=e.sibling}return!1}function g(e){for(e=e.return;e!==null;){if(e.tag===3||e.tag===5||e.tag===27)return e;e=e.return}return null}function _(e){var t=!1;for(e=e.return;e!==null&&(e.tag===4&&(t=!0),e.tag!==3&&e.tag!==5&&e.tag!==27);)e=e.return;return t}function v(e){var t=[null,null],n=g(e);return n===null||y(t,e,n.child,{foundSelf:!1}),t}function y(e,t,n,r){for(;n!==null;){if(n===t)r.foundSelf=!0;else if(n.tag===5||n.tag===27||n.tag===6){if(r.foundSelf)return e[1]=n,!0;e[0]=n}else if((n.tag!==22||n.memoizedState===null)&&y(e,t,n.child,r))return!0;n=n.sibling}return!1}function b(e){switch(e.tag){case 5:case 27:case 6:return e.stateNode;case 3:return e.stateNode.containerInfo;default:throw Error(i(559))}}var x=null,S=null;function C(e,t,n){return e===n||e===t&&(x=e,!0)}function w(e,t,n){return e===n?(S=e,!1):e===t&&(S!==null&&(x=e),!0)}function T(e){if(e===null)return null;do e=e===null?null:e.return;while(e&&e.tag!==5&&e.tag!==27&&e.tag!==3);return e||null}function E(e,t,n){for(var r=0,i=e;i;i=n(i))r++;i=0;for(var a=t;a;a=n(a))i++;for(;0<r-i;)e=n(e),r--;for(;0<i-r;)t=n(t),i--;for(;r--;){if(e===t||t!==null&&e===t.alternate)return e;e=n(e),t=n(t)}return null}var D=Object.assign,O=Symbol.for(`react.element`),k=Symbol.for(`react.transitional.element`),A=Symbol.for(`react.portal`),j=Symbol.for(`react.fragment`),M=Symbol.for(`react.strict_mode`),N=Symbol.for(`react.profiler`),P=Symbol.for(`react.consumer`),F=Symbol.for(`react.context`),I=Symbol.for(`react.forward_ref`),L=Symbol.for(`react.suspense`),ee=Symbol.for(`react.suspense_list`),te=Symbol.for(`react.memo`),ne=Symbol.for(`react.lazy`),re=Symbol.for(`react.activity`),ie=Symbol.for(`react.legacy_hidden`),ae=Symbol.for(`react.memo_cache_sentinel`),oe=Symbol.for(`react.view_transition`),se=Symbol.for(`react.recoverable`),ce=Symbol.iterator;function le(e){return typeof e!=`object`||!e?null:(e=ce&&e[ce]||e[`@@iterator`],typeof e==`function`?e:null)}var ue=Symbol.for(`react.client.reference`);function de(e){if(e==null)return null;if(typeof e==`function`)return e.$$typeof===ue?null:e.displayName||e.name||null;if(typeof e==`string`)return e;switch(e){case j:return`Fragment`;case N:return`Profiler`;case M:return`StrictMode`;case L:return`Suspense`;case ee:return`SuspenseList`;case re:return`Activity`;case oe:return`ViewTransition`}if(typeof e==`object`)switch(e.$$typeof){case A:return`Portal`;case F:return e.displayName||`Context`;case P:return(e._context.displayName||`Context`)+`.Consumer`;case I:var t=e.render;return e=e.displayName,e||=(e=t.displayName||t.name||``,e===``?`ForwardRef`:`ForwardRef(`+e+`)`),e;case te:return t=e.displayName||null,t===null?de(e.type)||`Memo`:t;case ne:t=e._payload,e=e._init;try{return de(e(t))}catch{}}return null}var fe=Array.isArray,R=n.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE,z=r.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE,pe={pending:!1,data:null,method:null,action:null},me=[],he=-1;function ge(e){return{current:e}}function _e(e){0>he||(e.current=me[he],me[he]=null,he--)}function B(e,t){he++,me[he]=e.current,e.current=t}var ve=ge(null),ye=ge(null),be=ge(null),xe=ge(null);function Se(e,t){switch(B(be,t),B(ye,e),B(ve,null),t.nodeType){case 9:case 11:e=(e=t.documentElement)&&(e=e.namespaceURI)?up(e):0;break;default:if(e=t.tagName,t=t.namespaceURI)t=up(t),e=dp(t,e);else switch(e){case`svg`:e=1;break;case`math`:e=2;break;default:e=0}}_e(ve),B(ve,e)}function Ce(){_e(ve),_e(ye),_e(be)}function we(e){var t=e.memoizedState;t!==null&&(sh._currentValue=t.memoizedState,B(xe,e)),t=ve.current;var n=dp(t,e.type);t!==n&&(B(ye,e),B(ve,n))}function Te(e){ye.current===e&&(_e(ve),_e(ye)),xe.current===e&&(_e(xe),sh._currentValue=pe)}var Ee,De;function Oe(e){if(Ee===void 0)try{throw Error()}catch(e){var t=e.stack.trim().match(/\n( *(at )?)/);Ee=t&&t[1]||``,De=-1<e.stack.indexOf(`
    at`)?` (<anonymous>)`:-1<e.stack.indexOf(`@`)?`@unknown:0:0`:``}return`
`+Ee+e+De}var ke=!1;function Ae(e,t){if(!e||ke)return``;ke=!0;var n=Error.prepareStackTrace;Error.prepareStackTrace=void 0;try{var r={DetermineComponentFrameRoot:function(){try{if(t){var n=function(){throw Error()};if(Object.defineProperty(n.prototype,"props",{set:function(){throw Error()}}),typeof Reflect==`object`&&Reflect.construct){try{Reflect.construct(n,[])}catch(e){var r=e}Reflect.construct(e,[],n)}else{try{n.call()}catch(e){r=e}n=!1;try{var i=Object.getOwnPropertyDescriptor(e.prototype,`props`);Object.defineProperty(e.prototype,"props",{configurable:!0,set:function(){throw Error()}}),n=!0,new e}finally{n&&(i===void 0?delete e.prototype.props:Object.defineProperty(e.prototype,"props",i))}}}else{try{throw Error()}catch(e){r=e}(n=e())&&typeof n.catch==`function`&&n.catch(function(){})}}catch(e){if(e&&r&&typeof e.stack==`string`)return[e.stack,r.stack]}return[null,null]}};r.DetermineComponentFrameRoot.displayName=`DetermineComponentFrameRoot`;var i=Object.getOwnPropertyDescriptor(r.DetermineComponentFrameRoot,`name`);i&&i.configurable&&Object.defineProperty(r.DetermineComponentFrameRoot,"name",{value:`DetermineComponentFrameRoot`});var a=r.DetermineComponentFrameRoot(),o=a[0],s=a[1];if(o&&s){var c=o.split(`
`),l=s.split(`
`);for(i=r=0;r<c.length&&!c[r].includes(`DetermineComponentFrameRoot`);)r++;for(;i<l.length&&!l[i].includes(`DetermineComponentFrameRoot`);)i++;if(r===c.length||i===l.length)for(r=c.length-1,i=l.length-1;1<=r&&0<=i&&c[r]!==l[i];)i--;for(;1<=r&&0<=i;r--,i--)if(c[r]!==l[i]){if(r!==1||i!==1)do if(r--,i--,0>i||c[r]!==l[i]){var u=`
`+c[r].replace(` at new `,` at `);return e.displayName&&u.includes(`<anonymous>`)&&(u=u.replace(`<anonymous>`,e.displayName)),u}while(1<=r&&0<=i);break}}}finally{ke=!1,Error.prepareStackTrace=n}return(n=e?e.displayName||e.name:``)?Oe(n):``}function je(e,t){switch(e.tag){case 26:case 27:case 5:return Oe(e.type);case 16:return Oe(`Lazy`);case 13:return e.child!==t&&t!==null?Oe(`Suspense Fallback`):Oe(`Suspense`);case 19:return Oe(`SuspenseList`);case 0:case 15:return Ae(e.type,!1);case 11:return Ae(e.type.render,!1);case 1:return Ae(e.type,!0);case 31:return Oe(`Activity`);case 30:return Oe(`ViewTransition`);default:return``}}function Me(e){try{var t=``,n=null;do t+=je(e,n),n=e,e=e.return;while(e);return t}catch(e){return`
Error generating stack: `+e.message+`
`+e.stack}}var Ne=Object.prototype.hasOwnProperty,Pe=t.unstable_scheduleCallback,Fe=t.unstable_cancelCallback,Ie=t.unstable_shouldYield,Le=t.unstable_requestPaint,Re=t.unstable_now,ze=t.unstable_getCurrentPriorityLevel,Be=t.unstable_ImmediatePriority,Ve=t.unstable_UserBlockingPriority,He=t.unstable_NormalPriority,Ue=t.unstable_LowPriority,We=t.unstable_IdlePriority,Ge=t.log,Ke=t.unstable_setDisableYieldValue,qe=null,Je=null;function Ye(e){if(typeof Ge==`function`&&Ke(e),Je&&typeof Je.setStrictMode==`function`)try{Je.setStrictMode(qe,e)}catch{}}var Xe=Math.clz32?Math.clz32:$e,Ze=Math.log,Qe=Math.LN2;function $e(e){return e>>>=0,e===0?32:31-(Ze(e)/Qe|0)|0}var et=256,tt=262144,nt=4194304;function rt(e){var t=e&42;if(t!==0)return t;switch(e&-e){case 1:return 1;case 2:return 2;case 4:return 4;case 8:return 8;case 16:return 16;case 32:return 32;case 64:return 64;case 128:return 128;case 256:case 512:case 1024:case 2048:case 4096:case 8192:case 16384:case 32768:case 65536:case 131072:return e&-e;case 262144:case 524288:case 1048576:case 2097152:return e&3932160;case 4194304:case 8388608:case 16777216:case 33554432:return e&62914560;case 67108864:return 67108864;case 134217728:return 134217728;case 268435456:return 268435456;case 536870912:return 536870912;case 1073741824:return 0;default:return e}}function it(e,t,n){var r=e.pendingLanes;if(r===0)return 0;var i=0,a=e.suspendedLanes,o=e.pingedLanes;e=e.warmLanes;var s=r&134217727;return s===0?(s=r&~a,s===0?o===0?n||(n=r&~e,n!==0&&(i=rt(n))):i=rt(o):i=rt(s)):(r=s&~a,r===0?(o&=s,o===0?n||(n=s&~e,n!==0&&(i=rt(n))):i=rt(o)):i=rt(r)),i===0?0:t!==0&&t!==i&&(t&a)===0&&(a=i&-i,n=t&-t,a>=n||a===32&&n&4194048)?t:i}function at(e,t){return(e.pendingLanes&~(e.suspendedLanes&~e.pingedLanes)&t)===0}function ot(e,t){t&8&&(t|=t&32);var n=e.entangledLanes;if(n!==0)for(e=e.entanglements,n&=t;0<n;){var r=31-Xe(n),i=1<<r;t|=e[r],n&=~i}return t}function st(e,t){switch(e){case 1:case 2:case 4:case 8:case 64:return t+250;case 16:case 32:case 128:case 256:case 512:case 1024:case 2048:case 4096:case 8192:case 16384:case 32768:case 65536:case 131072:case 262144:case 524288:case 1048576:case 2097152:return t+5e3;case 4194304:case 8388608:case 16777216:case 33554432:return-1;case 67108864:case 134217728:case 268435456:case 536870912:case 1073741824:return-1;default:return-1}}function ct(){var e=nt;return nt<<=1,!(nt&62914560)&&(nt=4194304),e}function lt(e){for(var t=[],n=0;31>n;n++)t.push(e);return t}function ut(e,t){e.pendingLanes|=t,t!==268435456&&(e.suspendedLanes=0,e.pingedLanes=0,e.warmLanes=0)}function dt(e,t,n,r,i,a){var o=e.pendingLanes;e.pendingLanes=n,e.suspendedLanes=0,e.pingedLanes=0,e.warmLanes=0,e.expiredLanes&=n,e.entangledLanes&=n,e.errorRecoveryDisabledLanes&=n,e.shellSuspendCounter=0;var s=e.entanglements,c=e.expirationTimes,l=e.hiddenUpdates;for(n=o&~n;0<n;){var u=31-Xe(n),d=1<<u;s[u]=0,c[u]=-1;var f=l[u];if(f!==null)for(l[u]=null,u=0;u<f.length;u++){var p=f[u];p!==null&&(p.lane&=-536870913)}n&=~d}r!==0&&ft(e,r,0),a!==0&&i===0&&e.tag!==0&&(e.suspendedLanes|=a&~(o&~t))}function ft(e,t,n){e.pendingLanes|=t,e.suspendedLanes&=~t;var r=31-Xe(t);e.entangledLanes|=t,e.entanglements[r]=e.entanglements[r]|1073741824|n&261930}function pt(e,t){var n=e.entangledLanes|=t;for(e=e.entanglements;n;){var r=31-Xe(n),i=1<<r;i&t|e[r]&t&&(e[r]|=t),n&=~i}}function mt(e,t){var n=t&-t;return n=n&42?1:ht(n),(n&(e.suspendedLanes|t))===0?n:0}function ht(e){switch(e){case 2:e=1;break;case 8:e=4;break;case 32:e=16;break;case 256:case 512:case 1024:case 2048:case 4096:case 8192:case 16384:case 32768:case 65536:case 131072:case 262144:case 524288:case 1048576:case 2097152:case 4194304:case 8388608:case 16777216:case 33554432:e=128;break;case 268435456:e=134217728;break;default:e=0}return e}function gt(e){return e&=-e,2<e?8<e?e&134217727?32:268435456:8:2}function _t(){var e=z.p;return e===0?(e=window.event,e===void 0?32:Ch(e.type)):e}function vt(e,t){var n=z.p;try{return z.p=e,t()}finally{z.p=n}}var yt=Math.random().toString(36).slice(2),bt=`__reactFiber$`+yt,xt=`__reactProps$`+yt,St=`__reactContainer$`+yt,Ct=`__reactEvents$`+yt,wt=`__reactListeners$`+yt,Tt=`__reactHandles$`+yt,Et=`__reactResources$`+yt,Dt=`__reactMarker$`+yt,Ot=`__reactLoad$`+yt;function kt(e){delete e[bt],delete e[xt],delete e[wt],delete e[Tt]}function At(e){var t;if(t=e[bt])return t;for(var n=e.parentNode;n;){if(t=n[St]||n[bt]){if(n=t.alternate,t.child!==null||n!==null&&n.child!==null)for(e=fm(e);e!==null;){if(n=e[bt])return n;e=fm(e)}return t}e=n,n=e.parentNode}return null}function jt(e){if(e=e[bt]||e[St]){var t=e.tag;if(t===5||t===6||t===13||t===31||t===26||t===27||t===3)return e}return null}function Mt(e){var t=e.tag;if(t===5||t===26||t===27||t===6)return e.stateNode;throw Error(i(33))}function Nt(e){var t=e[Et];return t||=e[Et]={hoistableStyles:new Map,hoistableScripts:new Map},t}function Pt(e){e[Dt]=!0}function Ft(e){e[Ot]=void 0}var It=new Set,Lt={};function Rt(e,t){zt(e,t),zt(e+`Capture`,t)}function zt(e,t){for(Lt[e]=t,e=0;e<t.length;e++)It.add(t[e])}var Bt=RegExp(`^[:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD][:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD\\-.0-9\\u00B7\\u0300-\\u036F\\u203F-\\u2040]*$`),Vt={},Ht={};function Ut(e){return Ne.call(Ht,e)?!0:Ne.call(Vt,e)?!1:Bt.test(e)?Ht[e]=!0:(Vt[e]=!0,!1)}var V=!1;function Wt(){var e=V;return V=!1,e}function Gt(e,t,n){if(Ut(t)){if(n===null)e.removeAttribute(t);else{switch(typeof n){case`undefined`:case`function`:case`symbol`:e.removeAttribute(t);return;case`boolean`:var r=t.toLowerCase().slice(0,5);if(r!==`data-`&&r!==`aria-`){e.removeAttribute(t);return}}e.setAttribute(t,n)}}}function Kt(e,t,n){if(n===null)e.removeAttribute(t);else{switch(typeof n){case`undefined`:case`function`:case`symbol`:case`boolean`:e.removeAttribute(t);return}e.setAttribute(t,n)}}function qt(e,t,n,r){if(r===null)e.removeAttribute(n);else{switch(typeof r){case`undefined`:case`function`:case`symbol`:case`boolean`:e.removeAttribute(n);return}e.setAttributeNS(t,n,r)}}function Jt(e){switch(typeof e){case`bigint`:case`boolean`:case`number`:case`string`:case`undefined`:return e;case`object`:return e;default:return``}}function Yt(e){var t=e.type;return(e=e.nodeName)&&e.toLowerCase()===`input`&&(t===`checkbox`||t===`radio`)}function Xt(e,t,n){var r=Object.getOwnPropertyDescriptor(e.constructor.prototype,t);if(!e.hasOwnProperty(t)&&r!==void 0&&typeof r.get==`function`&&typeof r.set==`function`){var i=r.get,a=r.set;return Object.defineProperty(e,t,{configurable:!0,get:function(){return i.call(this)},set:function(e){n=``+e,a.call(this,e)}}),Object.defineProperty(e,t,{enumerable:r.enumerable}),{getValue:function(){return n},setValue:function(e){n=``+e},stopTracking:function(){e._valueTracker=null,delete e[t]}}}}function Zt(e){if(!e._valueTracker){var t=Yt(e)?`checked`:`value`;e._valueTracker=Xt(e,t,``+e[t])}}function Qt(e){if(!e)return!1;var t=e._valueTracker;if(!t)return!0;var n=t.getValue(),r=``;return e&&(r=Yt(e)?e.checked?`true`:`false`:e.value),e=r,e!==n&&(t.setValue(e),!0)}var $t=/[\n"\\]/g;function en(e){return e.replace($t,function(e){return`\\`+e.charCodeAt(0).toString(16)+` `})}function tn(e,t,n,r,i,a,o,s){e.name=``,o!=null&&typeof o!=`function`&&typeof o!=`symbol`&&typeof o!=`boolean`?e.type=o:e.removeAttribute(`type`),t==null?o!==`submit`&&o!==`reset`||e.removeAttribute(`value`):o===`number`?(t===0&&e.value===``||e.value!=t)&&(e.value=``+Jt(t)):e.value!==``+Jt(t)&&(e.value=``+Jt(t)),t==null?n==null?r!=null&&e.removeAttribute(`value`):rn(e,Jt(n)):o===`number`&&e.value==t?rn(e,Jt(e.value)):rn(e,Jt(t)),i==null&&a!=null&&(e.defaultChecked=!!a),i!=null&&(e.checked=i&&typeof i!=`function`&&typeof i!=`symbol`),s!=null&&typeof s!=`function`&&typeof s!=`symbol`&&typeof s!=`boolean`?e.name=``+Jt(s):e.removeAttribute(`name`)}function nn(e,t,n,r,i,a,o,s){if(a!=null&&typeof a!=`function`&&typeof a!=`symbol`&&typeof a!=`boolean`&&(e.type=a),t!=null||n!=null){if(!(a!==`submit`&&a!==`reset`||t!=null)){Zt(e);return}n=n==null?``:``+Jt(n),t=t==null?n:``+Jt(t),s||t===e.value||(e.value=t),e.defaultValue=t}r??=i,r=typeof r!=`function`&&typeof r!=`symbol`&&!!r,e.checked=s?e.checked:!!r,e.defaultChecked=!!r,o!=null&&typeof o!=`function`&&typeof o!=`symbol`&&typeof o!=`boolean`&&(e.name=o),Zt(e)}function rn(e,t){e.defaultValue!==``+t&&(e.defaultValue=``+t)}function an(e,t,n,r){if(e=e.options,t){t={};for(var i=0;i<n.length;i++)t[`$`+n[i]]=!0;for(n=0;n<e.length;n++)i=t.hasOwnProperty(`$`+e[n].value),e[n].selected!==i&&(e[n].selected=i),i&&r&&(e[n].defaultSelected=!0)}else{for(n=``+Jt(n),t=null,i=0;i<e.length;i++){if(e[i].value===n){e[i].selected=!0,r&&(e[i].defaultSelected=!0);return}t!==null||e[i].disabled||(t=e[i])}t!==null&&(t.selected=!0)}}function on(e,t,n){t!=null&&(t=``+Jt(t),t!==e.value&&(e.value=t),n==null)?e.defaultValue!==t&&(e.defaultValue=t):e.defaultValue=n==null?``:``+Jt(n)}function sn(e,t,n,r){if(t==null){if(r!=null){if(n!=null)throw Error(i(92));if(fe(r)){if(1<r.length)throw Error(i(93));r=r[0]}n=r}n??=``,t=n}n=Jt(t),e.defaultValue=n,r=e.textContent,r===n&&r!==``&&r!==null&&(e.value=r),Zt(e)}function cn(e,t){if(t){var n=e.firstChild;if(n&&n===e.lastChild&&n.nodeType===3){n.nodeValue=t;return}}e.textContent=t}var ln=new Set(`animationIterationCount aspectRatio borderImageOutset borderImageSlice borderImageWidth boxFlex boxFlexGroup boxOrdinalGroup columnCount columns flex flexGrow flexPositive flexShrink flexNegative flexOrder gridArea gridRow gridRowEnd gridRowSpan gridRowStart gridColumn gridColumnEnd gridColumnSpan gridColumnStart fontWeight lineClamp lineHeight opacity order orphans scale tabSize widows zIndex zoom fillOpacity floodOpacity stopOpacity strokeDasharray strokeDashoffset strokeMiterlimit strokeOpacity strokeWidth MozAnimationIterationCount MozBoxFlex MozBoxFlexGroup MozLineClamp msAnimationIterationCount msFlex msZoom msFlexGrow msFlexNegative msFlexOrder msFlexPositive msFlexShrink msGridColumn msGridColumnSpan msGridRow msGridRowSpan WebkitAnimationIterationCount WebkitBoxFlex WebKitBoxFlexGroup WebkitBoxOrdinalGroup WebkitColumnCount WebkitColumns WebkitFlex WebkitFlexGrow WebkitFlexPositive WebkitFlexShrink WebkitLineClamp`.split(` `));function un(e,t,n){var r=t.indexOf(`--`)===0;n==null||typeof n==`boolean`||n===``?r?e.setProperty(t,``):t===`float`?e.cssFloat=``:e[t]=``:r?e.setProperty(t,n):typeof n!=`number`||n===0||ln.has(t)?t===`float`?e.cssFloat=n:e[t]=(``+n).trim():e[t]=n+`px`}function dn(e,t,n){if(t!=null&&typeof t!=`object`)throw Error(i(62));if(e=e.style,n!=null){for(var r in n)!n.hasOwnProperty(r)||t!=null&&t.hasOwnProperty(r)||(r.indexOf(`--`)===0?e.setProperty(r,``):r===`float`?e.cssFloat=``:e[r]=``,V=!0);for(var a in t)r=t[a],t.hasOwnProperty(a)&&n[a]!==r&&(un(e,a,r),V=!0)}else for(var o in t)t.hasOwnProperty(o)&&un(e,o,t[o])}function fn(e){if(e.indexOf(`-`)===-1)return!1;switch(e){case`annotation-xml`:case`color-profile`:case`font-face`:case`font-face-src`:case`font-face-uri`:case`font-face-format`:case`font-face-name`:case`missing-glyph`:return!1;default:return!0}}var pn=new Map([[`acceptCharset`,`accept-charset`],[`htmlFor`,`for`],[`httpEquiv`,`http-equiv`],[`crossOrigin`,`crossorigin`],[`accentHeight`,`accent-height`],[`alignmentBaseline`,`alignment-baseline`],[`arabicForm`,`arabic-form`],[`baselineShift`,`baseline-shift`],[`capHeight`,`cap-height`],[`clipPath`,`clip-path`],[`clipRule`,`clip-rule`],[`colorInterpolation`,`color-interpolation`],[`colorInterpolationFilters`,`color-interpolation-filters`],[`colorProfile`,`color-profile`],[`colorRendering`,`color-rendering`],[`dominantBaseline`,`dominant-baseline`],[`enableBackground`,`enable-background`],[`fillOpacity`,`fill-opacity`],[`fillRule`,`fill-rule`],[`floodColor`,`flood-color`],[`floodOpacity`,`flood-opacity`],[`fontFamily`,`font-family`],[`fontSize`,`font-size`],[`fontSizeAdjust`,`font-size-adjust`],[`fontStretch`,`font-stretch`],[`fontStyle`,`font-style`],[`fontVariant`,`font-variant`],[`fontWeight`,`font-weight`],[`glyphName`,`glyph-name`],[`glyphOrientationHorizontal`,`glyph-orientation-horizontal`],[`glyphOrientationVertical`,`glyph-orientation-vertical`],[`horizAdvX`,`horiz-adv-x`],[`horizOriginX`,`horiz-origin-x`],[`imageRendering`,`image-rendering`],[`letterSpacing`,`letter-spacing`],[`lightingColor`,`lighting-color`],[`markerEnd`,`marker-end`],[`markerMid`,`marker-mid`],[`markerStart`,`marker-start`],[`maskType`,`mask-type`],[`overlinePosition`,`overline-position`],[`overlineThickness`,`overline-thickness`],[`paintOrder`,`paint-order`],[`panose-1`,`panose-1`],[`pointerEvents`,`pointer-events`],[`renderingIntent`,`rendering-intent`],[`shapeRendering`,`shape-rendering`],[`stopColor`,`stop-color`],[`stopOpacity`,`stop-opacity`],[`strikethroughPosition`,`strikethrough-position`],[`strikethroughThickness`,`strikethrough-thickness`],[`strokeDasharray`,`stroke-dasharray`],[`strokeDashoffset`,`stroke-dashoffset`],[`strokeLinecap`,`stroke-linecap`],[`strokeLinejoin`,`stroke-linejoin`],[`strokeMiterlimit`,`stroke-miterlimit`],[`strokeOpacity`,`stroke-opacity`],[`strokeWidth`,`stroke-width`],[`textAnchor`,`text-anchor`],[`textDecoration`,`text-decoration`],[`textRendering`,`text-rendering`],[`transformOrigin`,`transform-origin`],[`underlinePosition`,`underline-position`],[`underlineThickness`,`underline-thickness`],[`unicodeBidi`,`unicode-bidi`],[`unicodeRange`,`unicode-range`],[`unitsPerEm`,`units-per-em`],[`vAlphabetic`,`v-alphabetic`],[`vHanging`,`v-hanging`],[`vIdeographic`,`v-ideographic`],[`vMathematical`,`v-mathematical`],[`vectorEffect`,`vector-effect`],[`vertAdvY`,`vert-adv-y`],[`vertOriginX`,`vert-origin-x`],[`vertOriginY`,`vert-origin-y`],[`wordSpacing`,`word-spacing`],[`writingMode`,`writing-mode`],[`xmlnsXlink`,`xmlns:xlink`],[`xHeight`,`x-height`]]),mn=/^[\u0000-\u001F ]*j[\r\n\t]*a[\r\n\t]*v[\r\n\t]*a[\r\n\t]*s[\r\n\t]*c[\r\n\t]*r[\r\n\t]*i[\r\n\t]*p[\r\n\t]*t[\r\n\t]*:/i;function hn(e){return mn.test(``+e)?`javascript:throw new Error('React has blocked a javascript: URL as a security precaution.')`:e}function gn(){}var _n=null;function vn(e){return e=e.target||e.srcElement||window,e.correspondingUseElement&&(e=e.correspondingUseElement),e.nodeType===3?e.parentNode:e}var yn=null,bn=null;function xn(e){var t=jt(e);if(t&&(e=t.stateNode)){var n=e[xt]||null;a:switch(e=t.stateNode,t.type){case`input`:if(tn(e,n.value,n.defaultValue,n.defaultValue,n.checked,n.defaultChecked,n.type,n.name),t=n.name,n.type===`radio`&&t!=null){for(n=e;n.parentNode;)n=n.parentNode;for(n=n.querySelectorAll(`input[name="`+en(``+t)+`"][type="radio"]`),t=0;t<n.length;t++){var r=n[t];if(r!==e&&r.form===e.form){var a=r[xt]||null;if(!a)throw Error(i(90));tn(r,a.value,a.defaultValue,a.defaultValue,a.checked,a.defaultChecked,a.type,a.name)}}for(t=0;t<n.length;t++)r=n[t],r.form===e.form&&Qt(r)}break a;case`textarea`:on(e,n.value,n.defaultValue);break a;case`select`:t=n.value,t!=null&&an(e,!!n.multiple,t,!1)}}}var Sn=!1;function Cn(e,t,n){if(Sn)return e(t,n);Sn=!0;try{return e(t)}finally{if(Sn=!1,(yn!==null||bn!==null)&&(zd(),yn&&(t=yn,e=bn,bn=yn=null,xn(t),e)))for(t=0;t<e.length;t++)xn(e[t])}}function wn(e,t){var n=e.stateNode;if(n===null)return null;var r=n[xt]||null;if(r===null)return null;n=r[t];a:switch(t){case`onClick`:case`onClickCapture`:case`onDoubleClick`:case`onDoubleClickCapture`:case`onMouseDown`:case`onMouseDownCapture`:case`onMouseMove`:case`onMouseMoveCapture`:case`onMouseUp`:case`onMouseUpCapture`:case`onMouseEnter`:(r=!r.disabled)||(e=e.type,r=e!==`button`&&e!==`input`&&e!==`select`&&e!==`textarea`),e=!r;break a;default:e=!1}if(e)return null;if(n&&typeof n!=`function`)throw Error(i(231,t,typeof n));return n}var Tn=typeof window<`u`&&window.document!==void 0&&window.document.createElement!==void 0,En=!1;if(Tn)try{var Dn={};Object.defineProperty(Dn,"passive",{get:function(){En=!0}}),window.addEventListener(`test`,Dn,Dn),window.removeEventListener(`test`,Dn,Dn)}catch{En=!1}var On=null,kn=null,An=null;function jn(){if(An)return An;var e,t=kn,n=t.length,r,i=`value`in On?On.value:On.textContent,a=i.length;for(e=0;e<n&&t[e]===i[e];e++);var o=n-e;for(r=1;r<=o&&t[n-r]===i[a-r];r++);return An=i.slice(e,1<r?1-r:void 0)}function Mn(e){var t=e.keyCode;return`charCode`in e?(e=e.charCode,e===0&&t===13&&(e=13)):e=t,e===10&&(e=13),32<=e||e===13?e:0}function Nn(){return!0}function Pn(){return!1}function Fn(e){function t(t,n,r,i,a){for(var o in this._reactName=t,this._targetInst=r,this.type=n,this.nativeEvent=i,this.target=a,this.currentTarget=null,e)e.hasOwnProperty(o)&&(t=e[o],this[o]=t?t(i):i[o]);return this.isDefaultPrevented=(i.defaultPrevented==null?!1===i.returnValue:i.defaultPrevented)?Nn:Pn,this.isPropagationStopped=Pn,this}return D(t.prototype,{preventDefault:function(){this.defaultPrevented=!0;var e=this.nativeEvent;e&&(e.preventDefault?e.preventDefault():typeof e.returnValue!=`unknown`&&(e.returnValue=!1),this.isDefaultPrevented=Nn)},stopPropagation:function(){var e=this.nativeEvent;e&&(e.stopPropagation?e.stopPropagation():typeof e.cancelBubble!=`unknown`&&(e.cancelBubble=!0),this.isPropagationStopped=Nn)},persist:function(){},isPersistent:Nn}),t}var In={eventPhase:0,bubbles:0,cancelable:0,timeStamp:function(e){return e.timeStamp||Date.now()},defaultPrevented:0,isTrusted:0},H=Fn(In),Ln=D({},In,{view:0,detail:0}),Rn=Fn(Ln),zn,Bn,Vn,Hn=D({},Ln,{screenX:0,screenY:0,clientX:0,clientY:0,pageX:0,pageY:0,ctrlKey:0,shiftKey:0,altKey:0,metaKey:0,getModifierState:$n,button:0,buttons:0,relatedTarget:function(e){return e.relatedTarget===void 0?e.fromElement===e.srcElement?e.toElement:e.fromElement:e.relatedTarget},movementX:function(e){return`movementX`in e?e.movementX:(e!==Vn&&(Vn&&e.type===`mousemove`?(zn=e.screenX-Vn.screenX,Bn=e.screenY-Vn.screenY):Bn=zn=0,Vn=e),zn)},movementY:function(e){return`movementY`in e?e.movementY:Bn}}),Un=Fn(Hn),Wn=Fn(D({},Hn,{dataTransfer:0})),Gn=Fn(D({},Ln,{relatedTarget:0})),Kn=Fn(D({},In,{animationName:0,elapsedTime:0,pseudoElement:0})),qn=Fn(D({},In,{clipboardData:function(e){return`clipboardData`in e?e.clipboardData:window.clipboardData}})),Jn=Fn(D({},In,{data:0})),Yn={Esc:`Escape`,Spacebar:` `,Left:`ArrowLeft`,Up:`ArrowUp`,Right:`ArrowRight`,Down:`ArrowDown`,Del:`Delete`,Win:`OS`,Menu:`ContextMenu`,Apps:`ContextMenu`,Scroll:`ScrollLock`,MozPrintableKey:`Unidentified`},Xn={8:`Backspace`,9:`Tab`,12:`Clear`,13:`Enter`,16:`Shift`,17:`Control`,18:`Alt`,19:`Pause`,20:`CapsLock`,27:`Escape`,32:` `,33:`PageUp`,34:`PageDown`,35:`End`,36:`Home`,37:`ArrowLeft`,38:`ArrowUp`,39:`ArrowRight`,40:`ArrowDown`,45:`Insert`,46:`Delete`,112:`F1`,113:`F2`,114:`F3`,115:`F4`,116:`F5`,117:`F6`,118:`F7`,119:`F8`,120:`F9`,121:`F10`,122:`F11`,123:`F12`,144:`NumLock`,145:`ScrollLock`,224:`Meta`},Zn={Alt:`altKey`,Control:`ctrlKey`,Meta:`metaKey`,Shift:`shiftKey`};function Qn(e){var t=this.nativeEvent;return t.getModifierState?t.getModifierState(e):(e=Zn[e])?!!t[e]:!1}function $n(){return Qn}var er=Fn(D({},Ln,{key:function(e){if(e.key){var t=Yn[e.key]||e.key;if(t!==`Unidentified`)return t}return e.type===`keypress`?(e=Mn(e),e===13?`Enter`:String.fromCharCode(e)):e.type===`keydown`||e.type===`keyup`?Xn[e.keyCode]||`Unidentified`:``},code:0,location:0,ctrlKey:0,shiftKey:0,altKey:0,metaKey:0,repeat:0,locale:0,getModifierState:$n,charCode:function(e){return e.type===`keypress`?Mn(e):0},keyCode:function(e){return e.type===`keydown`||e.type===`keyup`?e.keyCode:0},which:function(e){return e.type===`keypress`?Mn(e):e.type===`keydown`||e.type===`keyup`?e.keyCode:0}})),tr=Fn(D({},Hn,{pointerId:0,width:0,height:0,pressure:0,tangentialPressure:0,tiltX:0,tiltY:0,twist:0,pointerType:0,isPrimary:0})),nr=Fn(D({},In,{submitter:0})),rr=Fn(D({},Ln,{touches:0,targetTouches:0,changedTouches:0,altKey:0,metaKey:0,ctrlKey:0,shiftKey:0,getModifierState:$n})),ir=Fn(D({},In,{propertyName:0,elapsedTime:0,pseudoElement:0})),ar=Fn(D({},Hn,{deltaX:function(e){return`deltaX`in e?e.deltaX:`wheelDeltaX`in e?-e.wheelDeltaX:0},deltaY:function(e){return`deltaY`in e?e.deltaY:`wheelDeltaY`in e?-e.wheelDeltaY:`wheelDelta`in e?-e.wheelDelta:0},deltaZ:0,deltaMode:0})),or=Fn(D({},In,{newState:0,oldState:0,source:0})),sr=[9,13,27,32],cr=Tn&&`CompositionEvent`in window,lr=null;Tn&&`documentMode`in document&&(lr=document.documentMode);var ur=Tn&&`TextEvent`in window&&!lr,dr=Tn&&(!cr||lr&&8<lr&&11>=lr),fr=` `,pr=!1;function mr(e,t){switch(e){case`keyup`:return sr.indexOf(t.keyCode)!==-1;case`keydown`:return t.keyCode!==229;case`keypress`:case`mousedown`:case`focusout`:return!0;default:return!1}}function hr(e){return e=e.detail,typeof e==`object`&&`data`in e?e.data:null}var gr=!1;function _r(e,t){switch(e){case`compositionend`:return hr(t);case`keypress`:return t.which===32?(pr=!0,fr):null;case`textInput`:return e=t.data,e===fr&&pr?null:e;default:return null}}function vr(e,t){if(gr)return e===`compositionend`||!cr&&mr(e,t)?(e=jn(),An=kn=On=null,gr=!1,e):null;switch(e){case`paste`:return null;case`keypress`:if(!(t.ctrlKey||t.altKey||t.metaKey)||t.ctrlKey&&t.altKey){if(t.char&&1<t.char.length)return t.char;if(t.which)return String.fromCharCode(t.which)}return null;case`compositionend`:return dr&&t.locale!==`ko`?null:t.data;default:return null}}var yr={color:!0,date:!0,datetime:!0,"datetime-local":!0,email:!0,month:!0,number:!0,password:!0,range:!0,search:!0,tel:!0,text:!0,time:!0,url:!0,week:!0};function br(e){var t=e&&e.nodeName&&e.nodeName.toLowerCase();return t===`input`?!!yr[e.type]:t===`textarea`}function xr(e,t,n,r){yn?bn?bn.push(r):bn=[r]:yn=r,t=Jf(t,`onChange`),0<t.length&&(n=new H(`onChange`,`change`,null,n,r),e.push({event:n,listeners:t}))}var Sr=null,Cr=null;function wr(e){Vf(e,0)}function Tr(e){if(Qt(Mt(e)))return e}function Er(e,t){if(e===`change`)return t}var Dr=!1;if(Tn){var Or;if(Tn){var kr=`oninput`in document;if(!kr){var Ar=document.createElement(`div`);Ar.setAttribute(`oninput`,`return;`),kr=typeof Ar.oninput==`function`}Or=kr}else Or=!1;Dr=Or&&(!document.documentMode||9<document.documentMode)}function jr(){Sr&&(Sr.detachEvent(`onpropertychange`,Mr),Cr=Sr=null)}function Mr(e){if(e.propertyName===`value`&&Tr(Cr)){var t=[];xr(t,Cr,e,vn(e)),Cn(wr,t)}}function Nr(e,t,n){e===`focusin`?(jr(),Sr=t,Cr=n,Sr.attachEvent(`onpropertychange`,Mr)):e===`focusout`&&jr()}function Pr(e){if(e===`selectionchange`||e===`keyup`||e===`keydown`)return Tr(Cr)}function Fr(e,t){if(e===`click`)return Tr(t)}function Ir(e,t){if(e===`input`||e===`change`)return Tr(t)}function Lr(e,t){return e===t&&(e!==0||1/e==1/t)||e!==e&&t!==t}var Rr=typeof Object.is==`function`?Object.is:Lr;function zr(e,t){if(Rr(e,t))return!0;if(typeof e!=`object`||!e||typeof t!=`object`||!t)return!1;var n=Object.keys(e),r=Object.keys(t);if(n.length!==r.length)return!1;for(r=0;r<n.length;r++){var i=n[r];if(!Ne.call(t,i)||!Rr(e[i],t[i]))return!1}return!0}function Br(e){if(e||=typeof document<`u`?document:void 0,e===void 0)return null;try{return e.activeElement||e.body}catch{return e.body}}function Vr(e){for(;e&&e.firstChild;)e=e.firstChild;return e}function Hr(e,t){var n=Vr(e);e=0;for(var r;n;){if(n.nodeType===3){if(r=e+n.textContent.length,e<=t&&r>=t)return{node:n,offset:t-e};e=r}a:{for(;n;){if(n.nextSibling){n=n.nextSibling;break a}n=n.parentNode}n=void 0}n=Vr(n)}}function Ur(e,t){return e&&t?e===t?!0:e&&e.nodeType===3?!1:t&&t.nodeType===3?Ur(e,t.parentNode):`contains`in e?e.contains(t):e.compareDocumentPosition?!!(e.compareDocumentPosition(t)&16):!1:!1}function Wr(e){e=e!=null&&e.ownerDocument!=null&&e.ownerDocument.defaultView!=null?e.ownerDocument.defaultView:window;for(var t=Br(e.document);t instanceof e.HTMLIFrameElement;){try{var n=typeof t.contentWindow.location.href==`string`}catch{n=!1}if(n)e=t.contentWindow;else break;t=Br(e.document)}return t}function Gr(e){var t=e&&e.nodeName&&e.nodeName.toLowerCase();return t&&(t===`input`&&(e.type===`text`||e.type===`search`||e.type===`tel`||e.type===`url`||e.type===`password`)||t===`textarea`||e.contentEditable===`true`)}var Kr=Tn&&`documentMode`in document&&11>=document.documentMode,qr=null,Jr=null,Yr=null,Xr=!1;function Zr(e,t,n){var r=n.window===n?n.document:n.nodeType===9?n:n.ownerDocument;Xr||qr==null||qr!==Br(r)||(r=qr,`selectionStart`in r&&Gr(r)?r={start:r.selectionStart,end:r.selectionEnd}:(r=(r.ownerDocument&&r.ownerDocument.defaultView||window).getSelection(),r={anchorNode:r.anchorNode,anchorOffset:r.anchorOffset,focusNode:r.focusNode,focusOffset:r.focusOffset}),Yr&&zr(Yr,r)||(Yr=r,r=Jf(Jr,`onSelect`),0<r.length&&(t=new H(`onSelect`,`select`,null,t,n),e.push({event:t,listeners:r}),t.target=qr)))}function Qr(e,t){var n={};return n[e.toLowerCase()]=t.toLowerCase(),n[`Webkit`+e]=`webkit`+t,n[`Moz`+e]=`moz`+t,n}var $r={animationend:Qr(`Animation`,`AnimationEnd`),animationiteration:Qr(`Animation`,`AnimationIteration`),animationstart:Qr(`Animation`,`AnimationStart`),transitionrun:Qr(`Transition`,`TransitionRun`),transitionstart:Qr(`Transition`,`TransitionStart`),transitioncancel:Qr(`Transition`,`TransitionCancel`),transitionend:Qr(`Transition`,`TransitionEnd`)},ei={},ti={};Tn&&(ti=document.createElement(`div`).style,`AnimationEvent`in window||(delete $r.animationend.animation,delete $r.animationiteration.animation,delete $r.animationstart.animation),`TransitionEvent`in window||delete $r.transitionend.transition);function ni(e){if(ei[e])return ei[e];if(!$r[e])return e;var t=$r[e],n;for(n in t)if(t.hasOwnProperty(n)&&n in ti)return ei[e]=t[n];return e}var ri=ni(`animationend`),ii=ni(`animationiteration`),ai=ni(`animationstart`),oi=ni(`transitionrun`),si=ni(`transitionstart`),ci=ni(`transitioncancel`),li=ni(`transitionend`),ui=new Map,di=`abort auxClick beforeToggle cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error fullscreenChange fullscreenError gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll toggle touchMove waiting wheel`.split(` `);di.push(`scrollEnd`);function fi(e,t){ui.set(e,t),Rt(t,[e])}var pi=0;function mi(e,t){if(e.name!=null&&e.name!==`auto`)return e.name;if(t.autoName!==null)return t.autoName;e=bd.identifierPrefix;var n=pi++;return e=`_`+e+`t_`+n.toString(32)+`_`,t.autoName=e}function hi(e){if(e==null||typeof e==`string`)return e;var t=null,n=Od;if(n!==null)for(var r=0;r<n.length;r++){var i=e[n[r]];if(i!=null){if(i===`none`)return`none`;t=t==null?i:t+(` `+i)}}return t??e.default}function gi(e,t){return e=hi(e),t=hi(t),t==null?e===`auto`?null:e:t===`auto`?null:t}var _i=typeof reportError==`function`?reportError:function(e){if(typeof window==`object`&&typeof window.ErrorEvent==`function`){var t=new window.ErrorEvent(`error`,{bubbles:!0,cancelable:!0,message:typeof e==`object`&&e&&typeof e.message==`string`?String(e.message):String(e),error:e});if(!window.dispatchEvent(t))return}else if(typeof process==`object`&&typeof process.emit==`function`){process.emit(`uncaughtException`,e);return}console.error(e)},vi=[],yi=0,bi=0;function xi(){for(var e=yi,t=bi=yi=0;t<e;){var n=vi[t];vi[t++]=null;var r=vi[t];vi[t++]=null;var i=vi[t];vi[t++]=null;var a=vi[t];if(vi[t++]=null,r!==null&&i!==null){var o=r.pending;o===null?i.next=i:(i.next=o.next,o.next=i),r.pending=i}a!==0&&Ti(n,i,a)}}function Si(e,t,n,r){vi[yi++]=e,vi[yi++]=t,vi[yi++]=n,vi[yi++]=r,bi|=r,e.lanes|=r,e=e.alternate,e!==null&&(e.lanes|=r)}function Ci(e,t,n,r){return Si(e,t,n,r),Ei(e)}function wi(e,t){return Si(e,null,null,t),Ei(e)}function Ti(e,t,n){e.lanes|=n;var r=e.alternate;r!==null&&(r.lanes|=n);for(var i=!1,a=e.return;a!==null;)a.childLanes|=n,r=a.alternate,r!==null&&(r.childLanes|=n),a.tag===22&&(e=a.stateNode,e===null||e._visibility&1||(i=!0)),e=a,a=a.return;return e.tag===3?(a=e.stateNode,i&&t!==null&&(i=31-Xe(n),e=a.hiddenUpdates,r=e[i],r===null?e[i]=[t]:r.push(t),t.lane=n|536870912),a):null}function Ei(e){if(50<kd)throw kd=0,Ad=null,Error(i(185));for(var t=e.return;t!==null;)e=t,t=e.return;return e.tag===3?e.stateNode:null}var Di={};function Oi(e,t,n,r){this.tag=e,this.key=n,this.sibling=this.child=this.return=this.stateNode=this.type=this.elementType=null,this.index=0,this.refCleanup=this.ref=null,this.pendingProps=t,this.dependencies=this.memoizedState=this.updateQueue=this.memoizedProps=null,this.mode=r,this.subtreeFlags=this.flags=0,this.deletions=null,this.childLanes=this.lanes=0,this.alternate=null}function ki(e,t,n,r){return new Oi(e,t,n,r)}function Ai(e){return e=e.prototype,!(!e||!e.isReactComponent)}function ji(e,t){var n=e.alternate;return n===null?(n=ki(e.tag,t,e.key,e.mode),n.elementType=e.elementType,n.type=e.type,n.stateNode=e.stateNode,n.alternate=e,e.alternate=n):(n.pendingProps=t,n.type=e.type,n.flags=0,n.subtreeFlags=0,n.deletions=null),n.flags=e.flags&1206910976,n.childLanes=e.childLanes,n.lanes=e.lanes,n.child=e.child,n.memoizedProps=e.memoizedProps,n.memoizedState=e.memoizedState,n.updateQueue=e.updateQueue,t=e.dependencies,n.dependencies=t===null?null:{lanes:t.lanes,firstContext:t.firstContext},n.sibling=e.sibling,n.index=e.index,n.ref=e.ref,n.refCleanup=e.refCleanup,n}function Mi(e,t){e.flags&=1206910978;var n=e.alternate;return n===null?(e.childLanes=0,e.lanes=t,e.child=null,e.subtreeFlags=0,e.memoizedProps=null,e.memoizedState=null,e.updateQueue=null,e.dependencies=null,e.stateNode=null):(e.childLanes=n.childLanes,e.lanes=n.lanes,e.child=n.child,e.subtreeFlags=0,e.deletions=null,e.memoizedProps=n.memoizedProps,e.memoizedState=n.memoizedState,e.updateQueue=n.updateQueue,e.type=n.type,t=n.dependencies,e.dependencies=t===null?null:{lanes:t.lanes,firstContext:t.firstContext}),e}function Ni(e,t,n,r,a,o){var s=0;if(r=e,typeof r==`function`)Ai(r)&&(s=1);else if(typeof r==`string`)s=qm(e,n,ve.current)?26:e===`html`||e===`head`||e===`body`?27:5;else a:switch(r){case re:return e=ki(31,n,t,a),e.elementType=re,e.lanes=o,e;case j:return Pi(n.children,a,o,t);case M:s=8,a|=24;break;case N:return e=ki(12,n,t,a|2),e.elementType=N,e.lanes=o,e;case L:return e=ki(13,n,t,a),e.elementType=L,e.lanes=o,e;case ee:return e=ki(19,n,t,a),e.elementType=ee,e.lanes=o,e;case ie:case oe:return e=a|32,e=ki(30,n,t,e),e.elementType=oe,e.lanes=o,e.stateNode={autoName:null,paired:null,clones:null,ref:null},e;default:if(typeof r==`object`&&r)switch(r.$$typeof){case F:s=10;break a;case P:s=9;break a;case I:s=11;break a;case te:s=14;break a;case ne:s=16,r=null;break a}s=29,n=Error(i(130,e===null?`null`:typeof e,``)),r=null}return t=ki(s,n,t,a),t.elementType=e,t.type=r,t.lanes=o,t}function Pi(e,t,n,r){return e=ki(7,e,r,t),e.lanes=n,e}function Fi(e,t,n){return e=ki(6,e,null,t),e.lanes=n,e}function Ii(e){var t=ki(18,null,null,0);return t.stateNode=e,t}function Li(e,t,n){return t=ki(4,e.children===null?[]:e.children,e.key,t),t.lanes=n,t.stateNode={containerInfo:e.containerInfo,pendingChildren:null,implementation:e.implementation},t}var Ri=new WeakMap;function zi(e,t){if(typeof e==`object`&&e){var n=Ri.get(e);return n===void 0?(t={value:e,source:t,stack:Me(t)},Ri.set(e,t),t):n}return{value:e,source:t,stack:Me(t)}}var Bi=[],Vi=0,Hi=null,Ui=0,Wi=[],Gi=0,Ki=null,qi=1,Ji=``;function Yi(e,t){Bi[Vi++]=Ui,Bi[Vi++]=Hi,Hi=e,Ui=t}function Xi(e,t,n){Wi[Gi++]=qi,Wi[Gi++]=Ji,Wi[Gi++]=Ki,Ki=e;var r=qi;e=Ji;var i=32-Xe(r)-1;r&=~(1<<i),n+=1;var a=32-Xe(t)+i;if(30<a){var o=i-i%5;a=(r&(1<<o)-1).toString(32),r>>=o,i-=o,qi=1<<32-Xe(t)+i|n<<i|r,Ji=a+e}else qi=1<<a|n<<i|r,Ji=e}function Zi(e){e.return!==null&&(Yi(e,1),Xi(e,1,0))}function Qi(e){for(;e===Hi;)Hi=Bi[--Vi],Bi[Vi]=null,Ui=Bi[--Vi],Bi[Vi]=null;for(;e===Ki;)Ki=Wi[--Gi],Wi[Gi]=null,Ji=Wi[--Gi],Wi[Gi]=null,qi=Wi[--Gi],Wi[Gi]=null}function $i(e,t){Wi[Gi++]=qi,Wi[Gi++]=Ji,Wi[Gi++]=Ki,qi=t.id,Ji=t.overflow,Ki=e}var ea=null,ta=null,U=!1,na=null,ra=!1,ia=Error(i(519));function aa(e){throw da(zi(Error(i(418,1<arguments.length&&arguments[1]!==void 0&&arguments[1]?`text`:`HTML`,``)),e)),ia}function oa(e){var t=e.stateNode,n=e.type,r=e.memoizedProps;switch(t[bt]=e,t[xt]=r,n){case`dialog`:Q(`cancel`,t),Q(`close`,t);break;case`iframe`:case`object`:case`embed`:Q(`load`,t);break;case`video`:case`audio`:for(n=0;n<zf.length;n++)Q(zf[n],t);break;case`source`:Q(`error`,t);break;case`img`:case`image`:case`link`:Q(`error`,t),Q(`load`,t);break;case`details`:Q(`toggle`,t);break;case`input`:Q(`invalid`,t),nn(t,r.value,r.defaultValue,r.checked,r.defaultChecked,r.type,r.name,!0);break;case`select`:Q(`invalid`,t);break;case`textarea`:Q(`invalid`,t),sn(t,r.value,r.defaultValue,r.children)}n=r.children,typeof n!=`string`&&typeof n!=`number`&&typeof n!=`bigint`||t.textContent===``+n||!0===r.suppressHydrationWarning||ep(t.textContent,n)?(r.popover!=null&&(Q(`beforetoggle`,t),Q(`toggle`,t)),r.onScroll!=null&&Q(`scroll`,t),r.onScrollEnd!=null&&Q(`scrollend`,t),r.onClick!=null&&(t.onclick=gn),t=!0):t=!1,t||aa(e,!0)}function sa(e){for(ea=e.return;ea;)switch(ea.tag){case 5:case 31:case 13:ra=!1;return;case 27:case 3:ra=!0;return;default:ea=ea.return}}function ca(e){if(e!==ea)return!1;if(!U)return sa(e),U=!0,!1;var t=e.tag,n;if((n=t!==3&&t!==27)&&((n=t===5)&&(n=e.type,n=n===`form`||n===`button`||pp(e.type,e.memoizedProps)),n=!n),n&&ta&&aa(e),sa(e),t===13){if(e=e.memoizedState,e=e===null?null:e.dehydrated,!e)throw Error(i(317));ta=dm(e)}else if(t===31){if(e=e.memoizedState,e=e===null?null:e.dehydrated,!e)throw Error(i(317));ta=dm(e)}else t===27?(t=ta,Sp(e.type)?(e=um,um=null,ta=e):ta=t):ta=ea?lm(e.stateNode.nextSibling):null;return!0}function la(){ta=ea=null,U=!1}function ua(){var e=na;return e!==null&&(fd===null?fd=e:fd.push.apply(fd,e),na=null),e}function da(e){na===null?na=[e]:na.push(e)}var fa=ge(null),pa=null,ma=null;function ha(e,t,n){B(fa,t._currentValue),t._currentValue=n}function ga(e){e._currentValue=fa.current,_e(fa)}function _a(e,t,n){for(;e!==null;){var r=e.alternate;if((e.childLanes&t)===t?r!==null&&(r.childLanes&t)!==t&&(r.childLanes|=t):(e.childLanes|=t,r!==null&&(r.childLanes|=t)),e===n)break;e=e.return}}function va(e,t,n,r){var a=e.child;for(a!==null&&(a.return=e);a!==null;){var o=a.dependencies;if(o!==null){var s=a.child;o=o.firstContext;a:for(;o!==null;){var c=o;o=a;for(var l=0;l<t.length;l++)if(c.context===t[l]){o.lanes|=n,c=o.alternate,c!==null&&(c.lanes|=n),_a(o.return,n,e),r||(s=null);break a}o=c.next}}else if(a.tag===18){if(s=a.return,s===null)throw Error(i(341));s.lanes|=n,o=s.alternate,o!==null&&(o.lanes|=n),_a(s,n,e),s=null}else a.tag===13&&a.memoizedState!==null&&a.memoizedState.dehydrated===null?(a.lanes|=n,s=a.alternate,s!==null&&(s.lanes|=n),_a(a.return,n,e),s=a.child,s=s===null?null:s.sibling):s=a.child;if(s!==null)s.return=a;else for(s=a;s!==null;){if(s===e){s=null;break}if(a=s.sibling,a!==null){a.return=s.return,s=a;break}s=s.return}a=s}}function ya(e,t,n,r){e=null;for(var a=t,o=!1;a!==null;){if(!o){if(a.flags&524288)o=!0;else if(a.flags&262144)break}if(a.tag===10){var s=a.alternate;if(s===null)throw Error(i(387));if(s=s.memoizedProps,s!==null){var c=a.type;Rr(a.pendingProps.value,s.value)||(e===null?e=[c]:e.push(c))}}else if(a===xe.current){if(s=a.alternate,s===null)throw Error(i(387));s.memoizedState.memoizedState!==a.memoizedState.memoizedState&&(e===null?e=[sh]:e.push(sh))}a=a.return}return e!==null&&va(t,e,n,r),t.flags|=262144,e!==null}function ba(e){for(e=e.firstContext;e!==null;){if(!Rr(e.context._currentValue,e.memoizedValue))return!0;e=e.next}return!1}function xa(e){pa=e,ma=null,e=e.dependencies,e!==null&&(e.firstContext=null)}function Sa(e){return wa(pa,e)}function Ca(e,t){return pa===null&&xa(e),wa(e,t)}function wa(e,t){var n=t._currentValue;if(t={context:t,memoizedValue:n,next:null},ma===null){if(e===null)throw Error(i(308));ma=t,e.dependencies={lanes:0,firstContext:t},e.flags|=524288}else ma=ma.next=t;return n}var Ta=typeof AbortController<`u`?AbortController:function(){var e=[],t=this.signal={aborted:!1,addEventListener:function(t,n){e.push(n)}};this.abort=function(){t.aborted=!0,e.forEach(function(e){return e()})}},Ea=t.unstable_scheduleCallback,Da=t.unstable_NormalPriority,Oa={$$typeof:F,Consumer:null,Provider:null,_currentValue:null,_currentValue2:null,_threadCount:0};function ka(){return{controller:new Ta,data:new Map,refCount:0}}function Aa(e){e.refCount--,e.refCount===0&&Ea(Da,function(){e.controller.abort()})}function ja(e,t){if(e.pendingLanes&4194048){var n=e.transitionTypes;for(n===null&&(n=e.transitionTypes=[]),e=0;e<t.length;e++){var r=t[e];n.indexOf(r)===-1&&n.push(r)}}}var Ma=null;function Na(e){var t=e.transitionTypes;return e.transitionTypes=null,t}var Pa=null,Fa=0,Ia=0,La=null;function Ra(e,t){if(Pa===null){var n=Pa=[];Fa=0,Ia=Pf(),La={status:`pending`,value:void 0,then:function(e){n.push(e)}}}return Fa++,t.then(za,za),t}function za(){if(--Fa===0&&(Ma=null,Pa!==null)){La!==null&&(La.status=`fulfilled`);var e=Pa;Pa=null,Ia=0,La=null;for(var t=0;t<e.length;t++)(0,e[t])()}}function Ba(e,t){var n=[],r={status:`pending`,value:null,reason:null,then:function(e){n.push(e)}};return e.then(function(){r.status=`fulfilled`,r.value=t;for(var e=0;e<n.length;e++)(0,n[e])(t)},function(e){for(r.status=`rejected`,r.reason=e,e=0;e<n.length;e++)(0,n[e])(void 0)}),r}var Va=R.S;R.S=function(e,t){if(hd=Re(),typeof t==`object`&&t&&typeof t.then==`function`&&Ra(e,t),Ma!==null)for(var n=bf;n!==null;)ja(n,Ma),n=n.next;if(n=e.types,n!==null){for(var r=bf;r!==null;)ja(r,n),r=r.next;if(Ia!==0){r=Ma,r===null&&(r=Ma=[]);for(var i=0;i<n.length;i++){var a=n[i];r.indexOf(a)===-1&&r.push(a)}}}Va!==null&&Va(e,t)};var Ha=ge(null);function Ua(){var e=Ha.current;return e===null?$u.pooledCache:e}function Wa(e,t){t===null?B(Ha,Ha.current):B(Ha,t.pool)}function Ga(){var e=Ua();return e===null?null:{parent:Oa._currentValue,pool:e}}var Ka=Error(i(460)),qa=Error(i(474)),Ja=Error(i(542)),Ya={then:function(){}};function Xa(e){return e=e.status,e===`fulfilled`||e===`rejected`}function Za(e,t,n){switch(n=e[n],n===void 0?e.push(t):n!==t&&(t.then(gn,gn),t=n),t.status){case`fulfilled`:return t.value;case`rejected`:throw e=t.reason,to(e),e===void 0&&!(`reason`in t)?Error(i(600)):e;default:if(typeof t.status==`string`)t.then(gn,gn);else{if(e=$u,e!==null&&100<e.shellSuspendCounter)throw Error(i(482));e=t,e.status=`pending`,e.then(function(e){if(t.status===`pending`){var n=t;n.status=`fulfilled`,n.value=e}},function(e){if(t.status===`pending`){var n=t;n.status=`rejected`,n.reason=e}})}switch(t.status){case`fulfilled`:return t.value;case`rejected`:throw e=t.reason,to(e),e}throw $a=t,Ka}}function Qa(e){try{var t=e._init;return t(e._payload)}catch(e){throw typeof e==`object`&&e&&typeof e.then==`function`?($a=e,Ka):e}}var $a=null;function eo(){if($a===null)throw Error(i(459));var e=$a;return $a=null,e}function to(e){if(e===Ka||e===Ja)throw Error(i(483))}var no=null,ro=0;function io(e){var t=ro;return ro+=1,no===null&&(no=[]),Za(no,e,t)}function ao(e,t){t=t.props.ref,e.ref=t===void 0?null:t}function oo(e,t){throw t.$$typeof===O?Error(i(525)):(e=Object.prototype.toString.call(t),Error(i(31,e===`[object Object]`?`object with keys {`+Object.keys(t).join(`, `)+`}`:e)))}function so(e){function t(t,n){if(e){var r=t.deletions;r===null?(t.deletions=[n],t.flags|=16):r.push(n)}}function n(n,r){if(!e)return null;for(;r!==null;)t(n,r),r=r.sibling;return null}function r(e){for(var t=new Map;e!==null;)e.key===null?t.set(e.index,e):t.set(e.key,e),e=e.sibling;return t}function a(e,t){return e=ji(e,t),e.index=0,e.sibling=null,e}function o(t,n,r){return t.index=r,e?(r=t.alternate,r===null?(t.flags|=134217730,n):(r=r.index,r<n?(t.flags|=2,n):r)):(t.flags|=1048576,n)}function s(t){return e&&t.alternate===null&&(t.flags|=134217730),t}function c(e,t,n,r){return t===null||t.tag!==6?(t=Fi(n,e.mode,r),t.return=e,t):(t=a(t,n),t.return=e,t)}function l(e,t,n,r){var i=n.type;return i===j?(e=d(e,t,n.props.children,r,n.key),ao(e,n),e):t!==null&&(t.elementType===i||typeof i==`object`&&i&&i.$$typeof===ne&&Qa(i)===t.type)?(t=a(t,n.props),ao(t,n),t.return=e,t):(t=Ni(n.type,n.key,n.props,null,e.mode,r),ao(t,n),t.return=e,t)}function u(e,t,n,r){return t===null||t.tag!==4||t.stateNode.containerInfo!==n.containerInfo||t.stateNode.implementation!==n.implementation?(t=Li(n,e.mode,r),t.return=e,t):(t=a(t,n.children||[]),t.return=e,t)}function d(e,t,n,r,i){return t===null||t.tag!==7?(t=Pi(n,e.mode,r,i),t.return=e,t):(t=a(t,n),t.return=e,t)}function f(e,t,n){if(typeof t==`string`&&t!==``||typeof t==`number`||typeof t==`bigint`)return t=Fi(``+t,e.mode,n),t.return=e,t;if(typeof t==`object`&&t){switch(t.$$typeof){case k:return n=Ni(t.type,t.key,t.props,null,e.mode,n),ao(n,t),n.return=e,n;case A:return t=Li(t,e.mode,n),t.return=e,t;case ne:return t=Qa(t),f(e,t,n)}if(fe(t)||le(t))return t=Pi(t,e.mode,n,null),t.return=e,t;if(typeof t.then==`function`)return f(e,io(t),n);if(t.$$typeof===F)return f(e,Ca(e,t),n);oo(e,t)}return null}function p(e,t,n,r){var i=t===null?null:t.key;if(typeof n==`string`&&n!==``||typeof n==`number`||typeof n==`bigint`)return i===null?c(e,t,``+n,r):null;if(typeof n==`object`&&n){switch(n.$$typeof){case k:return n.key===i?l(e,t,n,r):null;case A:return n.key===i?u(e,t,n,r):null;case ne:return n=Qa(n),p(e,t,n,r)}if(fe(n)||le(n))return i===null?d(e,t,n,r,null):null;if(typeof n.then==`function`)return p(e,t,io(n),r);if(n.$$typeof===F)return p(e,t,Ca(e,n),r);oo(e,n)}return null}function m(e,t,n,r,i){if(typeof r==`string`&&r!==``||typeof r==`number`||typeof r==`bigint`)return e=e.get(n)||null,c(t,e,``+r,i);if(typeof r==`object`&&r){switch(r.$$typeof){case k:return e=e.get(r.key===null?n:r.key)||null,l(t,e,r,i);case A:return e=e.get(r.key===null?n:r.key)||null,u(t,e,r,i);case ne:return r=Qa(r),m(e,t,n,r,i)}if(fe(r)||le(r))return e=e.get(n)||null,d(t,e,r,i,null);if(typeof r.then==`function`)return m(e,t,n,io(r),i);if(r.$$typeof===F)return m(e,t,n,Ca(t,r),i);oo(t,r)}return null}function h(i,a,s,c){for(var l=null,u=null,d=a,h=a=0,g=null;d!==null&&h<s.length;h++){d.index>h?(g=d,d=null):g=d.sibling;var _=p(i,d,s[h],c);if(_===null){d===null&&(d=g);break}e&&d&&_.alternate===null&&t(i,d),a=o(_,a,h),u===null?l=_:u.sibling=_,u=_,d=g}if(h===s.length)return n(i,d),U&&Yi(i,h),l;if(d===null){for(;h<s.length;h++)d=f(i,s[h],c),d!==null&&(a=o(d,a,h),u===null?l=d:u.sibling=d,u=d);return U&&Yi(i,h),l}for(d=r(d);h<s.length;h++)g=m(d,i,h,s[h],c),g!==null&&(e&&(_=g.alternate,_!==null&&d.delete(_.key===null?h:_.key)),a=o(g,a,h),u===null?l=g:u.sibling=g,u=g);return e&&d.forEach(function(e){return t(i,e)}),U&&Yi(i,h),l}function g(a,s,c,l){if(c==null)throw Error(i(151));for(var u=null,d=null,h=s,g=s=0,_=null,v=c.next();h!==null&&!v.done;g++,v=c.next()){h.index>g?(_=h,h=null):_=h.sibling;var y=p(a,h,v.value,l);if(y===null){h===null&&(h=_);break}e&&h&&y.alternate===null&&t(a,h),s=o(y,s,g),d===null?u=y:d.sibling=y,d=y,h=_}if(v.done)return n(a,h),U&&Yi(a,g),u;if(h===null){for(;!v.done;g++,v=c.next())v=f(a,v.value,l),v!==null&&(s=o(v,s,g),d===null?u=v:d.sibling=v,d=v);return U&&Yi(a,g),u}for(h=r(h);!v.done;g++,v=c.next())v=m(h,a,g,v.value,l),v!==null&&(e&&(_=v.alternate,_!==null&&h.delete(_.key===null?g:_.key)),s=o(v,s,g),d===null?u=v:d.sibling=v,d=v);return e&&h.forEach(function(e){return t(a,e)}),U&&Yi(a,g),u}function _(e,r,o,c){if(typeof o==`object`&&o&&o.type===j&&o.key===null&&o.props.ref===void 0&&(o=o.props.children),typeof o==`object`&&o){switch(o.$$typeof){case k:a:{for(var l=o.key;r!==null;){if(r.key===l){if(l=o.type,l===j){if(r.tag===7){n(e,r.sibling),c=a(r,o.props.children),ao(c,o),c.return=e,e=c;break a}}else if(r.elementType===l||typeof l==`object`&&l&&l.$$typeof===ne&&Qa(l)===r.type){n(e,r.sibling),c=a(r,o.props),ao(c,o),c.return=e,e=c;break a}n(e,r);break}t(e,r),r=r.sibling}o.type===j?(c=Pi(o.props.children,e.mode,c,o.key),ao(c,o),c.return=e,e=c):(c=Ni(o.type,o.key,o.props,null,e.mode,c),ao(c,o),c.return=e,e=c)}return s(e);case A:a:{for(l=o.key;r!==null;){if(r.key===l){if(r.tag===4&&r.stateNode.containerInfo===o.containerInfo&&r.stateNode.implementation===o.implementation){n(e,r.sibling),c=a(r,o.children||[]),c.return=e,e=c;break a}n(e,r);break}t(e,r),r=r.sibling}c=Li(o,e.mode,c),c.return=e,e=c}return s(e);case ne:return o=Qa(o),_(e,r,o,c)}if(fe(o))return h(e,r,o,c);if(le(o)){if(l=le(o),typeof l!=`function`)throw Error(i(150));return o=l.call(o),g(e,r,o,c)}if(typeof o.then==`function`)return _(e,r,io(o),c);if(o.$$typeof===F)return _(e,r,Ca(e,o),c);oo(e,o)}return typeof o==`string`&&o!==``||typeof o==`number`||typeof o==`bigint`?(o=``+o,r!==null&&r.tag===6?(n(e,r.sibling),c=a(r,o),c.return=e,e=c):(n(e,r),c=Fi(o,e.mode,c),c.return=e,e=c),s(e)):n(e,r)}return function(e,t,n,r){try{ro=0;var i=_(e,t,n,r);return no=null,i}catch(t){if(t===Ka||t===Ja)throw t;var a=ki(29,t,null,e.mode);return a.lanes=r,a.return=e,a}}}var co=so(!0),lo=so(!1),uo=!1;function fo(e){e.updateQueue={baseState:e.memoizedState,firstBaseUpdate:null,lastBaseUpdate:null,shared:{pending:null,lanes:0,hiddenCallbacks:null},callbacks:null}}function po(e,t){e=e.updateQueue,t.updateQueue===e&&(t.updateQueue={baseState:e.baseState,firstBaseUpdate:e.firstBaseUpdate,lastBaseUpdate:e.lastBaseUpdate,shared:e.shared,callbacks:null})}function mo(e){return{lane:e,tag:0,payload:null,callback:null,next:null}}function ho(e,t,n){var r=e.updateQueue;if(r===null)return null;if(r=r.shared,q&2){var i=r.pending;return i===null?t.next=t:(t.next=i.next,i.next=t),r.pending=t,t=Ei(e),Ti(e,null,n),t}return Si(e,r,t,n),Ei(e)}function go(e,t,n){if(t=t.updateQueue,t!==null&&(t=t.shared,n&4194048)){var r=t.lanes;r&=e.pendingLanes,n|=r,t.lanes=n,pt(e,n)}}function _o(e,t){var n=e.updateQueue,r=e.alternate;if(r!==null&&(r=r.updateQueue,n===r)){var i=null,a=null;if(n=n.firstBaseUpdate,n!==null){do{var o={lane:n.lane,tag:n.tag,payload:n.payload,callback:null,next:null};a===null?i=a=o:a=a.next=o,n=n.next}while(n!==null);a===null?i=a=t:a=a.next=t}else i=a=t;n={baseState:r.baseState,firstBaseUpdate:i,lastBaseUpdate:a,shared:r.shared,callbacks:r.callbacks},e.updateQueue=n}else e=n.lastBaseUpdate,e===null?n.firstBaseUpdate=t:e.next=t,n.lastBaseUpdate=t}var vo=!1;function yo(){if(vo){var e=La;if(e!==null)throw e}}function bo(e,t,n,r){vo=!1;var i=e.updateQueue;uo=!1;var a=i.firstBaseUpdate,o=i.lastBaseUpdate,s=i.shared.pending;if(s!==null){i.shared.pending=null;var c=s,l=c.next;c.next=null,o===null?a=l:o.next=l,o=c;var u=e.alternate;u!==null&&(u=u.updateQueue,s=u.lastBaseUpdate,s!==o&&(s===null?u.firstBaseUpdate=l:s.next=l,u.lastBaseUpdate=c))}if(a!==null){var d=i.baseState;o=0,u=l=c=null,s=a;do{var f=s.lane&-536870913,p=f!==s.lane;if(p?(Y&f)===f:(r&f)===f){f!==0&&f===Ia&&(vo=!0),u!==null&&(u=u.next={lane:0,tag:s.tag,payload:s.payload,callback:null,next:null});a:{var m=e,h=s;f=t;var g=n;switch(h.tag){case 1:if(m=h.payload,typeof m==`function`){d=m.call(g,d,f);break a}d=m;break a;case 3:m.flags=m.flags&-65537|128;case 0:if(m=h.payload,f=typeof m==`function`?m.call(g,d,f):m,f==null)break a;d=D({},d,f);break a;case 2:uo=!0}}f=s.callback,f!==null&&(e.flags|=64,p&&(e.flags|=8192),p=i.callbacks,p===null?i.callbacks=[f]:p.push(f))}else p={lane:f,tag:s.tag,payload:s.payload,callback:s.callback,next:null},u===null?(l=u=p,c=d):u=u.next=p,o|=f;if(s=s.next,s===null){if(s=i.shared.pending,s===null)break;p=s,s=p.next,p.next=null,i.lastBaseUpdate=p,i.shared.pending=null}}while(1);u===null&&(c=d),i.baseState=c,i.firstBaseUpdate=l,i.lastBaseUpdate=u,a===null&&(i.shared.lanes=0),od|=o,e.lanes=o,e.memoizedState=d}}function xo(e,t){if(typeof e!=`function`)throw Error(i(191,e));e.call(t)}function So(e,t){var n=e.callbacks;if(n!==null)for(e.callbacks=null,e=0;e<n.length;e++)xo(n[e],t)}var Co=ge(null),wo=ge(0);function To(e,t){e=id,B(wo,e),B(Co,t),id=e|t.baseLanes}function Eo(){B(wo,id),B(Co,Co.current)}function Do(){id=wo.current,_e(Co),_e(wo)}var Oo=ge(null),ko=null;function Ao(e){var t=e.alternate;B(Fo,Fo.current&1),B(Oo,e),ko===null&&(t===null||Co.current!==null||t.memoizedState!==null)&&(ko=e)}function jo(e){B(Fo,Fo.current),B(Oo,e),ko===null&&(ko=e)}function Mo(e){e.tag===22?(B(Fo,Fo.current),B(Oo,e),ko===null&&(ko=e)):No()}function No(){B(Fo,Fo.current),B(Oo,Oo.current)}function Po(e){_e(Oo),ko===e&&(ko=null),_e(Fo)}var Fo=ge(0);function Io(e,t){B(Oo,Oo.current),B(Fo,t)}function Lo(e){_e(Fo),_e(Oo),ko===e&&(ko=null)}function Ro(e){for(var t=e;t!==null;){if(t.tag===13){var n=t.memoizedState;if(n!==null&&(n=n.dehydrated,n===null||om(n)||sm(n)))return t}else if(t.tag===19&&t.memoizedProps.revealOrder!==`independent`){if(t.flags&128)return t}else if(t.child!==null){t.child.return=t,t=t.child;continue}if(t===e)break;for(;t.sibling===null;){if(t.return===null||t.return===e)return null;t=t.return}t.sibling.return=t.return,t=t.sibling}return null}var zo=0,W=null,G=null,Bo=null,Vo=!1,Ho=!1,Uo=!1,Wo=0,Go=0,Ko=null,qo=0;function Jo(){throw Error(i(321))}function Yo(e,t){if(t===null)return!1;for(var n=0;n<t.length&&n<e.length;n++)if(!Rr(e[n],t[n]))return!1;return!0}function Xo(e,t,n,r,i,a){return zo=a,W=t,t.memoizedState=null,t.updateQueue=null,t.lanes=0,R.H=e===null||e.memoizedState===null?pc:mc,Uo=!1,a=n(r,i),Uo=!1,Ho&&(a=Qo(t,n,r,i)),Zo(e),a}function Zo(e){R.H=fc;var t=G!==null&&G.next!==null;if(zo=0,Bo=G=W=null,Vo=!1,Go=0,Ko=null,t)throw Error(i(300));e===null||jc||(e=e.dependencies,e!==null&&ba(e)&&(jc=!0))}function Qo(e,t,n,r){W=e;var a=0;do{if(Ho&&(Ko=null),Go=0,Ho=!1,25<=a)throw Error(i(301));if(a+=1,Bo=G=null,e.updateQueue!=null){var o=e.updateQueue;o.lastEffect=null,o.events=null,o.stores=null,o.memoCache!=null&&(o.memoCache.index=0)}R.H=hc,o=t(n,r)}while(Ho);return o}function $o(){var e=R.H,t=e.useState()[0];return t=typeof t.then==`function`?os(t):t,e=e.useState()[0],(G===null?null:G.memoizedState)!==e&&(W.flags|=1024),t}function es(){var e=Wo!==0;return Wo=0,e}function ts(e,t,n){t.updateQueue=e.updateQueue,t.flags&=-2053,e.lanes&=~n}function ns(e){if(Vo){for(e=e.memoizedState;e!==null;){var t=e.queue;t!==null&&(t.pending=null),e=e.next}Vo=!1}zo=0,Bo=G=W=null,Ho=!1,Go=Wo=0,Ko=null}function rs(){var e={memoizedState:null,baseState:null,baseQueue:null,queue:null,next:null};return Bo===null?W.memoizedState=Bo=e:Bo=Bo.next=e,Bo}function is(){if(G===null){var e=W.alternate;e=e===null?null:e.memoizedState}else e=G.next;var t=Bo===null?W.memoizedState:Bo.next;if(t!==null)Bo=t,G=e;else{if(e===null)throw W.alternate===null?Error(i(467)):Error(i(310));G=e,e={memoizedState:G.memoizedState,baseState:G.baseState,baseQueue:G.baseQueue,queue:G.queue,next:null},Bo===null?W.memoizedState=Bo=e:Bo=Bo.next=e}return Bo}function as(){return{lastEffect:null,events:null,stores:null,memoCache:null}}function os(e){var t=Go;return Go+=1,Ko===null&&(Ko=[]),e=Za(Ko,e,t),t=W,(Bo===null?t.memoizedState:Bo.next)===null&&(t=t.alternate,R.H=t===null||t.memoizedState===null?pc:mc),e}function ss(e){if(typeof e==`object`&&e){if(typeof e.then==`function`)return os(e);if(e.$$typeof===se)return;if(e.$$typeof===F)return Sa(e)}throw Error(i(438,String(e)))}function cs(e){var t=null,n=W.updateQueue;if(n!==null&&(t=n.memoCache),t==null){var r=W.alternate;r!==null&&(r=r.updateQueue,r!==null&&(r=r.memoCache,r!=null&&(t={data:r.data.map(function(e){return e.slice()}),index:0})))}if(t??={data:[],index:0},n===null&&(n=as(),W.updateQueue=n),n.memoCache=t,n=t.data[t.index],n===void 0)for(n=t.data[t.index]=Array(e),r=0;r<e;r++)n[r]=ae;return t.index++,n}function ls(e,t){return typeof t==`function`?t(e):t}function us(e){return ds(is(),G,e)}function ds(e,t,n){var r=e.queue;if(r===null)throw Error(i(311));r.lastRenderedReducer=n;var a=e.baseQueue,o=r.pending;if(o!==null){if(a!==null){var s=a.next;a.next=o.next,o.next=s}t.baseQueue=a=o,r.pending=null}if(o=e.baseState,a===null)e.memoizedState=o;else{t=a.next;var c=s=null,l=null,u=t,d=!1;do{var f=u.lane&-536870913;if(f===u.lane?(zo&f)===f:(Y&f)===f){var p=u.revertLane;if(p===0)l!==null&&(l=l.next={lane:0,revertLane:0,gesture:null,action:u.action,hasEagerState:u.hasEagerState,eagerState:u.eagerState,next:null}),f===Ia&&(d=!0);else if((zo&p)===p){u=u.next,p===Ia&&(d=!0);continue}else f={lane:0,revertLane:u.revertLane,gesture:null,action:u.action,hasEagerState:u.hasEagerState,eagerState:u.eagerState,next:null},l===null?(c=l=f,s=o):l=l.next=f,W.lanes|=p,od|=p;f=u.action,Uo&&n(o,f),o=u.hasEagerState?u.eagerState:n(o,f)}else p={lane:f,revertLane:u.revertLane,gesture:u.gesture,action:u.action,hasEagerState:u.hasEagerState,eagerState:u.eagerState,next:null},l===null?(c=l=p,s=o):l=l.next=p,W.lanes|=f,od|=f;u=u.next}while(u!==null&&u!==t);if(l===null?s=o:l.next=c,!Rr(o,e.memoizedState)&&(jc=!0,d&&(n=La,n!==null)))throw n;e.memoizedState=o,e.baseState=s,e.baseQueue=l,r.lastRenderedState=o}return a===null&&(r.lanes=0),[e.memoizedState,r.dispatch]}function fs(e){var t=is(),n=t.queue;if(n===null)throw Error(i(311));n.lastRenderedReducer=e;var r=n.dispatch,a=n.pending,o=t.memoizedState;if(a!==null){n.pending=null;var s=a=a.next;do o=e(o,s.action),s=s.next;while(s!==a);Rr(o,t.memoizedState)||(jc=!0),t.memoizedState=o,t.baseQueue===null&&(t.baseState=o),n.lastRenderedState=o}return[o,r]}function ps(e,t,n){var r=W,a=is(),o=U;if(o){if(n===void 0)throw Error(i(407));n=n()}else n=t();var s=!Rr((G||a).memoizedState,n);if(s&&(a.memoizedState=n,jc=!0),a=a.queue,Rs(gs.bind(null,r,a,e),[e]),e=a.getSnapshot!==t||s||Bo!==null&&!!(Bo.memoizedState.tag&1),Ns(e?9:8,{destroy:void 0},hs.bind(null,r,a,n,t),null),e){if(r.flags|=2048,$u===null)throw Error(i(349));o||zo&127||ms(r,t,n)}return n}function ms(e,t,n){e.flags|=16384,e={getSnapshot:t,value:n},t=W.updateQueue,t===null?(t=as(),W.updateQueue=t,t.stores=[e]):(n=t.stores,n===null?t.stores=[e]:n.push(e))}function hs(e,t,n,r){t.value=n,t.getSnapshot=r,_s(t)&&vs(e)}function gs(e,t,n){return n(function(){_s(t)&&vs(e)})}function _s(e){var t=e.getSnapshot;e=e.value;try{var n=t();return!Rr(e,n)}catch{return!0}}function vs(e){var t=wi(e,2);t!==null&&Pd(t,e,2)}function ys(e){var t=rs();if(typeof e==`function`){var n=e;if(e=n(),Uo){Ye(!0);try{n()}finally{Ye(!1)}}}return t.memoizedState=t.baseState=e,t.queue={pending:null,lanes:0,dispatch:null,lastRenderedReducer:ls,lastRenderedState:e},t}function bs(e,t,n,r){return e.baseState=n,ds(e,G,typeof r==`function`?r:ls)}function xs(e,t,n,r,a){if(lc(e))throw Error(i(485));if(e=t.action,e!==null){var o={payload:a,action:e,next:null,isTransition:!0,status:`pending`,value:null,reason:null,listeners:[],then:function(e){o.listeners.push(e)}};R.T===null?o.isTransition=!1:n(!0),r(o),n=t.pending,n===null?(o.next=t.pending=o,Ss(t,o)):(o.next=n.next,t.pending=n.next=o)}}function Ss(e,t){var n=t.action,r=t.payload,i=e.state;if(t.isTransition){var a=R.T,o={};o.types=a===null?null:a.types,R.T=o;try{var s=n(i,r),c=R.S;c!==null&&c(o,s),Cs(e,t,s)}catch(n){Ts(e,t,n)}finally{a!==null&&o.types!==null&&(a.types=o.types),R.T=a}}else try{a=n(i,r),Cs(e,t,a)}catch(n){Ts(e,t,n)}}function Cs(e,t,n){typeof n==`object`&&n&&typeof n.then==`function`?n.then(function(n){ws(e,t,n)},function(n){return Ts(e,t,n)}):ws(e,t,n)}function ws(e,t,n){t.status=`fulfilled`,t.value=n,Es(t),e.state=n,t=e.pending,t!==null&&(n=t.next,n===t?e.pending=null:(n=n.next,t.next=n,Ss(e,n)))}function Ts(e,t,n){var r=e.pending;if(e.pending=null,r!==null){r=r.next;do t.status=`rejected`,t.reason=n,Es(t),t=t.next;while(t!==r)}e.action=null}function Es(e){e=e.listeners;for(var t=0;t<e.length;t++)(0,e[t])()}function Ds(e,t){return t}function Os(e,t){if(U){var n=$u.formState;if(n!==null){a:{var r=W;if(U){if(ta){b:{for(var i=ta,a=ra;i.nodeType!==8;)if(!a||(i=lm(i.nextSibling),i===null)){i=null;break b}a=i.data,i=a===`F!`||a===`F`?i:null}if(i){ta=lm(i.nextSibling),r=i.data===`F!`;break a}}aa(r)}r=!1}r&&(t=n[0])}}return n=rs(),n.memoizedState=n.baseState=t,r={pending:null,lanes:0,dispatch:null,lastRenderedReducer:Ds,lastRenderedState:t},n.queue=r,n=oc.bind(null,W,r),r.dispatch=n,r=ys(!1),a=cc.bind(null,W,!1,r.queue),r=rs(),i={state:t,dispatch:null,action:e,pending:null},r.queue=i,n=xs.bind(null,W,i,a,n),i.dispatch=n,r.memoizedState=e,[t,n,!1]}function ks(e){return As(is(),G,e)}function As(e,t,n){if(t=ds(e,t,Ds)[0],e=us(ls)[0],typeof t==`object`&&t&&typeof t.then==`function`)try{var r=os(t)}catch(e){throw e===Ka?Ja:e}else r=t;t=is();var i=t.queue,a=i.dispatch;return n!==t.memoizedState&&(W.flags|=2048,Ns(9,{destroy:void 0},js.bind(null,i,n),null)),[r,a,e]}function js(e,t){e.action=t}function Ms(e){var t=is(),n=G;if(n!==null)return As(t,n,e);is(),t=t.memoizedState,n=is();var r=n.queue.dispatch;return n.memoizedState=e,[t,r,!1]}function Ns(e,t,n,r){return e={tag:e,create:n,deps:r,inst:t,next:null},t=W.updateQueue,t===null&&(t=as(),W.updateQueue=t),n=t.lastEffect,n===null?t.lastEffect=e.next=e:(r=n.next,n.next=e,e.next=r,t.lastEffect=e),e}function Ps(){return is().memoizedState}function Fs(e,t,n,r){var i=rs();W.flags|=e,i.memoizedState=Ns(1|t,{destroy:void 0},n,r===void 0?null:r)}function Is(e,t,n,r){var i=is();r=r===void 0?null:r;var a=i.memoizedState.inst;G!==null&&r!==null&&Yo(r,G.memoizedState.deps)?i.memoizedState=Ns(t,a,n,r):(W.flags|=e,i.memoizedState=Ns(1|t,a,n,r))}function Ls(e,t){Fs(8390656,8,e,t)}function Rs(e,t){Is(2048,8,e,t)}function zs(e){W.flags|=4;var t=W.updateQueue;if(t===null)t=as(),W.updateQueue=t,t.events=[e];else{var n=t.events;n===null?t.events=[e]:n.push(e)}}function Bs(e){var t=is().memoizedState;return zs({ref:t,nextImpl:e}),function(){if(q&2)throw Error(i(440));return t.impl.apply(void 0,arguments)}}function Vs(e,t){return Is(4,2,e,t)}function Hs(e,t){return Is(4,4,e,t)}function Us(e,t){if(typeof t==`function`){e=e();var n=t(e);return function(){typeof n==`function`?n():t(null)}}if(t!=null)return e=e(),t.current=e,function(){t.current=null}}function Ws(e,t,n){n=n==null?null:n.concat([e]),Is(4,4,Us.bind(null,t,e),n)}function Gs(){}function Ks(e,t){var n=is();t=t===void 0?null:t;var r=n.memoizedState;return t!==null&&Yo(t,r[1])?r[0]:(n.memoizedState=[e,t],e)}function qs(e,t){var n=is();t=t===void 0?null:t;var r=n.memoizedState;if(t!==null&&Yo(t,r[1]))return r[0];if(r=e(),Uo){Ye(!0);try{e()}finally{Ye(!1)}}return n.memoizedState=[r,t],r}function Js(e,t,n){return n===void 0||zo&1073741824&&!(Y&261930)?e.memoizedState=t:(e.memoizedState=n,e=Md(),W.lanes|=e,od|=e,n)}function Ys(e,t,n,r){return Rr(n,t)?n:Co.current===null?!(zo&106)||zo&1073741824&&!(Y&261930)?(jc=!0,e.memoizedState=n):(e=Md(),W.lanes|=e,od|=e,t):(e=Js(e,n,r),Rr(e,t)||(jc=!0),e)}function Xs(e,t,n,r,i){var a=z.p;z.p=a!==0&&8>a?a:8;var o=R.T,s={};s.types=o===null?null:o.types,R.T=s,cc(e,!1,t,n);try{var c=i(),l=R.S;l!==null&&l(s,c),typeof c==`object`&&c&&typeof c.then==`function`?sc(e,t,Ba(c,r),jd(e)):sc(e,t,r,jd(e))}catch(n){sc(e,t,{then:function(){},status:`rejected`,reason:n},jd())}finally{z.p=a,o!==null&&s.types!==null&&(o.types=s.types),R.T=o}}function Zs(){}function Qs(e,t,n,r){if(e.tag!==5)throw Error(i(476));var a=$s(e).queue;Xs(e,a,t,pe,n===null?Zs:function(){return ec(e),n(r)})}function $s(e){var t=e.memoizedState;if(t!==null)return t;t={memoizedState:pe,baseState:pe,baseQueue:null,queue:{pending:null,lanes:0,dispatch:null,lastRenderedReducer:ls,lastRenderedState:pe},next:null};var n={};return t.next={memoizedState:n,baseState:n,baseQueue:null,queue:{pending:null,lanes:0,dispatch:null,lastRenderedReducer:ls,lastRenderedState:n},next:null},e.memoizedState=t,e=e.alternate,e!==null&&(e.memoizedState=t),t}function ec(e){var t=$s(e);t.next===null&&(t=e.alternate.memoizedState),sc(e,t.next.queue,{},jd())}function tc(){return Sa(sh)}function nc(){return is().memoizedState}function rc(){return is().memoizedState}function ic(e){for(var t=e.return;t!==null;){switch(t.tag){case 24:case 3:var n=jd();e=mo(n);var r=ho(t,e,n);r!==null&&(Pd(r,t,n),go(r,t,n)),t={cache:ka()},e.payload=t;return}t=t.return}}function ac(e,t,n){var r=jd();n={lane:r,revertLane:0,gesture:null,action:n,hasEagerState:!1,eagerState:null,next:null},lc(e)?uc(t,n):(n=Ci(e,t,n,r),n!==null&&(Pd(n,e,r),dc(n,t,r)))}function oc(e,t,n){sc(e,t,n,jd())}function sc(e,t,n,r){var i={lane:r,revertLane:0,gesture:null,action:n,hasEagerState:!1,eagerState:null,next:null};if(lc(e))uc(t,i);else{var a=e.alternate;if(e.lanes===0&&(a===null||a.lanes===0)&&(a=t.lastRenderedReducer,a!==null))try{var o=t.lastRenderedState,s=a(o,n);if(i.hasEagerState=!0,i.eagerState=s,Rr(s,o))return Si(e,t,i,0),$u===null&&xi(),!1}catch{}if(n=Ci(e,t,i,r),n!==null)return Pd(n,e,r),dc(n,t,r),!0}return!1}function cc(e,t,n,r){if(r={lane:2,revertLane:Pf(),gesture:null,action:r,hasEagerState:!1,eagerState:null,next:null},lc(e)){if(t)throw Error(i(479))}else t=Ci(e,n,r,2),t!==null&&Pd(t,e,2)}function lc(e){var t=e.alternate;return e===W||t!==null&&t===W}function uc(e,t){Ho=Vo=!0;var n=e.pending;n===null?t.next=t:(t.next=n.next,n.next=t),e.pending=t}function dc(e,t,n){if(n&4194048){var r=t.lanes;r&=e.pendingLanes,n|=r,t.lanes=n,pt(e,n)}}var fc={readContext:Sa,use:ss,useCallback:Jo,useContext:Jo,useEffect:Jo,useImperativeHandle:Jo,useLayoutEffect:Jo,useInsertionEffect:Jo,useMemo:Jo,useReducer:Jo,useRef:Jo,useState:Jo,useDebugValue:Jo,useDeferredValue:Jo,useTransition:Jo,useSyncExternalStore:Jo,useId:Jo,useHostTransitionStatus:Jo,useFormState:Jo,useActionState:Jo,useOptimistic:Jo,useMemoCache:Jo,useCacheRefresh:Jo,useEffectEvent:Jo},pc={readContext:Sa,use:ss,useCallback:function(e,t){return rs().memoizedState=[e,t===void 0?null:t],e},useContext:Sa,useEffect:Ls,useImperativeHandle:function(e,t,n){n=n==null?null:n.concat([e]),Fs(4194308,4,Us.bind(null,t,e),n)},useLayoutEffect:function(e,t){return Fs(4194308,4,e,t)},useInsertionEffect:function(e,t){Fs(4,2,e,t)},useMemo:function(e,t){var n=rs();t=t===void 0?null:t;var r=e();if(Uo){Ye(!0);try{e()}finally{Ye(!1)}}return n.memoizedState=[r,t],r},useReducer:function(e,t,n){var r=rs();if(n!==void 0){var i=n(t);if(Uo){Ye(!0);try{n(t)}finally{Ye(!1)}}}else i=t;return r.memoizedState=r.baseState=i,e={pending:null,lanes:0,dispatch:null,lastRenderedReducer:e,lastRenderedState:i},r.queue=e,e=e.dispatch=ac.bind(null,W,e),[r.memoizedState,e]},useRef:function(e){var t=rs();return e={current:e},t.memoizedState=e},useState:function(e){e=ys(e);var t=e.queue,n=oc.bind(null,W,t);return t.dispatch=n,[e.memoizedState,n]},useDebugValue:Gs,useDeferredValue:function(e,t){return Js(rs(),e,t)},useTransition:function(){var e=ys(!1);return e=Xs.bind(null,W,e.queue,!0,!1),rs().memoizedState=e,[!1,e]},useSyncExternalStore:function(e,t,n){var r=W,a=rs();if(U){if(n===void 0)throw Error(i(407));n=n()}else{if(n=t(),$u===null)throw Error(i(349));Y&127||ms(r,t,n)}a.memoizedState=n;var o={value:n,getSnapshot:t};return a.queue=o,Ls(gs.bind(null,r,o,e),[e]),r.flags|=2048,Ns(9,{destroy:void 0},hs.bind(null,r,o,n,t),null),n},useId:function(){var e=rs(),t=$u.identifierPrefix;if(U){var n=Ji,r=qi;n=(r&~(1<<32-Xe(r)-1)).toString(32)+n,t=`_`+t+`R_`+n,n=Wo++,0<n&&(t+=`H`+n.toString(32)),t+=`_`}else n=qo++,t=`_`+t+`r_`+n.toString(32)+`_`;return e.memoizedState=t},useHostTransitionStatus:tc,useFormState:Os,useActionState:Os,useOptimistic:function(e){var t=rs();t.memoizedState=t.baseState=e;var n={pending:null,lanes:0,dispatch:null,lastRenderedReducer:null,lastRenderedState:null};return t.queue=n,t=cc.bind(null,W,!0,n),n.dispatch=t,[e,t]},useMemoCache:cs,useCacheRefresh:function(){return rs().memoizedState=ic.bind(null,W)},useEffectEvent:function(e){var t=rs(),n={impl:e};return t.memoizedState=n,function(){if(q&2)throw Error(i(440));return n.impl.apply(void 0,arguments)}}},mc={readContext:Sa,use:ss,useCallback:Ks,useContext:Sa,useEffect:Rs,useImperativeHandle:Ws,useInsertionEffect:Vs,useLayoutEffect:Hs,useMemo:qs,useReducer:us,useRef:Ps,useState:function(){return us(ls)},useDebugValue:Gs,useDeferredValue:function(e,t){return Ys(is(),G.memoizedState,e,t)},useTransition:function(){var e=us(ls)[0],t=is().memoizedState;return[typeof e==`boolean`?e:os(e),t]},useSyncExternalStore:ps,useId:nc,useHostTransitionStatus:tc,useFormState:ks,useActionState:ks,useOptimistic:function(e,t){return bs(is(),G,e,t)},useMemoCache:cs,useCacheRefresh:rc,useEffectEvent:Bs},hc={readContext:Sa,use:ss,useCallback:Ks,useContext:Sa,useEffect:Rs,useImperativeHandle:Ws,useInsertionEffect:Vs,useLayoutEffect:Hs,useMemo:qs,useReducer:fs,useRef:Ps,useState:function(){return fs(ls)},useDebugValue:Gs,useDeferredValue:function(e,t){var n=is();return G===null?Js(n,e,t):Ys(n,G.memoizedState,e,t)},useTransition:function(){var e=fs(ls)[0],t=is().memoizedState;return[typeof e==`boolean`?e:os(e),t]},useSyncExternalStore:ps,useId:nc,useHostTransitionStatus:tc,useFormState:Ms,useActionState:Ms,useOptimistic:function(e,t){var n=is();return G===null?(n.baseState=e,[e,n.queue.dispatch]):bs(n,G,e,t)},useMemoCache:cs,useCacheRefresh:rc,useEffectEvent:Bs};function gc(e,t,n,r){t=e.memoizedState,n=n(r,t),n=n==null?t:D({},t,n),e.memoizedState=n,e.lanes===0&&(e.updateQueue.baseState=n)}var _c={enqueueSetState:function(e,t,n){e=e._reactInternals;var r=jd(),i=mo(r);i.payload=t,n!=null&&(i.callback=n),t=ho(e,i,r),t!==null&&(Pd(t,e,r),go(t,e,r))},enqueueReplaceState:function(e,t,n){e=e._reactInternals;var r=jd(),i=mo(r);i.tag=1,i.payload=t,n!=null&&(i.callback=n),t=ho(e,i,r),t!==null&&(Pd(t,e,r),go(t,e,r))},enqueueForceUpdate:function(e,t){e=e._reactInternals;var n=jd(),r=mo(n);r.tag=2,t!=null&&(r.callback=t),t=ho(e,r,n),t!==null&&(Pd(t,e,n),go(t,e,n))}};function vc(e,t,n,r,i,a,o){return e=e.stateNode,typeof e.shouldComponentUpdate==`function`?e.shouldComponentUpdate(r,a,o):t.prototype&&t.prototype.isPureReactComponent?!zr(n,r)||!zr(i,a):!0}function yc(e,t,n,r){e=t.state,typeof t.componentWillReceiveProps==`function`&&t.componentWillReceiveProps(n,r),typeof t.UNSAFE_componentWillReceiveProps==`function`&&t.UNSAFE_componentWillReceiveProps(n,r),t.state!==e&&_c.enqueueReplaceState(t,t.state,null)}function bc(e,t){var n=t;if(`ref`in t)for(var r in n={},t)r!==`ref`&&(n[r]=t[r]);if(e=e.defaultProps)for(var i in n===t&&(n=D({},n)),e)n[i]===void 0&&(n[i]=e[i]);return n}function xc(e){_i(e)}function Sc(e){console.error(e)}function Cc(e){_i(e)}function wc(e,t){try{var n=e.onUncaughtError;n(t.value,{componentStack:t.stack})}catch(e){setTimeout(function(){throw e})}}function Tc(e,t,n){try{var r=e.onCaughtError;r(n.value,{componentStack:n.stack,errorBoundary:t.tag===1?t.stateNode:null})}catch(e){setTimeout(function(){throw e})}}function Ec(e,t,n){return n=mo(n),n.tag=3,n.payload={element:null},n.callback=function(){wc(e,t)},n}function Dc(e){return e=mo(e),e.tag=3,e}function Oc(e,t,n,r){var i=n.type.getDerivedStateFromError;if(typeof i==`function`){var a=r.value;e.payload=function(){return i(a)},e.callback=function(){Tc(t,n,r)}}var o=n.stateNode;o!==null&&typeof o.componentDidCatch==`function`&&(e.callback=function(){Tc(t,n,r),typeof i!=`function`&&(vd===null?vd=new Set([this]):vd.add(this));var e=r.stack;this.componentDidCatch(r.value,{componentStack:e===null?``:e})})}function kc(e,t,n,r,a){if(n.flags|=32768,typeof r==`object`&&r&&typeof r.then==`function`){if(t=n.alternate,t!==null&&ya(t,n,a,!0),n=Oo.current,n!==null){switch(n.tag){case 31:case 13:case 19:return ko===null?Kd():n.alternate===null&&ad===0&&(ad=3),n.flags&=-257,n.flags|=65536,n.lanes=a,r===Ya?n.flags|=16384:(t=n.updateQueue,t===null?n.updateQueue=new Set([r]):t.add(r),mf(e,r,a)),!1;case 22:return n.flags|=65536,r===Ya?n.flags|=16384:(t=n.updateQueue,t===null?(t={transitions:null,markerInstances:null,retryQueue:new Set([r])},n.updateQueue=t):(n=t.retryQueue,n===null?t.retryQueue=new Set([r]):n.add(r)),mf(e,r,a)),!1}throw Error(i(435,n.tag))}return mf(e,r,a),Kd(),!1}if(U)return t=Oo.current,t===null?(r!==ia&&(t=Error(i(423),{cause:r}),da(zi(t,n))),e=e.current.alternate,e.flags|=65536,a&=-a,e.lanes|=a,r=zi(r,n),a=Ec(e.stateNode,r,a),_o(e,a),ad!==4&&(ad=2)):(!(t.flags&65536)&&(t.flags|=256),t.flags|=65536,t.lanes=a,r!==ia&&(e=Error(i(422),{cause:r}),da(zi(e,n)))),!1;var o=Error(i(520),{cause:r});if(o=zi(o,n),dd===null?dd=[o]:dd.push(o),ad!==4&&(ad=2),t===null)return!0;r=zi(r,n),n=t;do{switch(n.tag){case 3:return n.flags|=65536,e=a&-a,n.lanes|=e,e=Ec(n.stateNode,r,e),_o(n,e),!1;case 1:if(t=n.type,o=n.stateNode,!(n.flags&128)&&(typeof t.getDerivedStateFromError==`function`||o!==null&&typeof o.componentDidCatch==`function`&&(vd===null||!vd.has(o))))return n.flags|=65536,a&=-a,n.lanes|=a,a=Dc(a),Oc(a,e,n,r),_o(n,a),!1;break;case 22:if(n.memoizedState!==null)return n.flags|=65536,!1}n=n.return}while(n!==null);return!1}var Ac=Error(i(461)),jc=!1;function Mc(e,t,n,r){t.child=e===null?lo(t,null,n,r):co(t,e.child,n,r)}function Nc(e,t,n,r,i){n=n.render;var a=t.ref;if(`ref`in r){var o={};for(var s in r)s!==`ref`&&(o[s]=r[s])}else o=r;return xa(t),r=Xo(e,t,n,o,a,i),s=es(),e!==null&&!jc?(ts(e,t,i),sl(e,t,i)):(U&&s&&Zi(t),t.flags|=1,Mc(e,t,r,i),t.child)}function Pc(e,t,n,r,i){if(e===null){var a=n.type;return typeof a==`function`&&!Ai(a)&&a.defaultProps===void 0&&n.compare===null?(t.tag=15,t.type=a,Fc(e,t,a,r,i)):(e=Ni(n.type,null,r,t,t.mode,i),e.ref=t.ref,e.return=t,t.child=e)}if(a=e.child,!cl(e,i)){var o=a.memoizedProps;if(n=n.compare,n=n===null?zr:n,n(o,r)&&e.ref===t.ref)return sl(e,t,i)}return t.flags|=1,e=ji(a,r),e.ref=t.ref,e.return=t,t.child=e}function Fc(e,t,n,r,i){if(e!==null){var a=e.memoizedProps;if(zr(a,r)&&e.ref===t.ref){if(jc=!1,t.pendingProps=r=a,cl(e,i))e.flags&131072&&(jc=!0);else return t.lanes=e.lanes,sl(e,t,i)}}return Uc(e,t,n,r,i)}function Ic(e,t,n,r){var i=r.children,a=e===null?null:e.memoizedState;if(e===null&&t.stateNode===null&&(t.stateNode={_visibility:1,_pendingMarkers:null,_retryCache:null,_transitions:null}),r.mode===`hidden`){if(t.flags&128){if(a=a===null?n:a.baseLanes|n,e!==null){for(r=t.child=e.child,i=0;r!==null;)i=i|r.lanes|r.childLanes,r=r.sibling;r=i&~a}else r=0,t.child=null;return Rc(e,t,a,n,r)}if(n&536870912)t.memoizedState={baseLanes:0,cachePool:null},e!==null&&Wa(t,a===null?null:a.cachePool),a===null?Eo():To(t,a),Mo(t);else return r=t.lanes=536870912,Rc(e,t,a===null?n:a.baseLanes|n,n,r)}else a===null?(e!==null&&Wa(t,null),Eo(),No()):(Wa(t,a.cachePool),To(t,a),No(),t.memoizedState=null);return Mc(e,t,i,n),t.child}function Lc(e,t){return e!==null&&e.tag===22||t.stateNode!==null||(t.stateNode={_visibility:1,_pendingMarkers:null,_retryCache:null,_transitions:null}),t.sibling}function Rc(e,t,n,r,i){var a=Ua();return a=a===null?null:{parent:Oa._currentValue,pool:a},t.memoizedState={baseLanes:n,cachePool:a},e!==null&&Wa(t,null),Eo(),Mo(t),e!==null&&ya(e,t,r,!0),t.childLanes=i,null}function zc(e,t){return t=Qc({mode:t.mode,children:t.children},e.mode),t.ref=e.ref,e.child=t,t.return=e,t}function Bc(e,t,n){return co(t,e.child,null,n),e=zc(t,t.pendingProps),e.flags|=2,Po(t),t.memoizedState=null,e}function Vc(e,t,n){var r=t.pendingProps,a=!!(t.flags&128);if(t.flags&=-129,e===null){if(U){if(r.mode===`hidden`)return e=zc(t,r),t.lanes=536870912,e.memoizedState={baseLanes:0,cachePool:null},Lc(null,e);if(jo(t),(e=ta)?(e=am(e,ra),e=e!==null&&e.data===`&`?e:null,e!==null&&(t.memoizedState={dehydrated:e,treeContext:Ki===null?null:{id:qi,overflow:Ji},retryLane:536870912,hydrationErrors:null},n=Ii(e),n.return=t,t.child=n,ea=t,ta=null)):e=null,e===null)throw aa(t);return t.lanes=536870912,null}return zc(t,r)}var o=e.memoizedState;if(o!==null){var s=o.dehydrated;if(jo(t),a){if(t.flags&256)t.flags&=-257,t=Bc(e,t,n);else if(t.memoizedState!==null)t.child=e.child,t.flags|=128,t=null;else throw Error(i(558))}else if(jc||ya(e,t,n,!1),a=(n&e.childLanes)!==0,jc||a){if(Co.current===null){if(r=$u,r!==null&&(s=mt(r,n),s!==0&&s!==o.retryLane))throw o.retryLane=s,wi(e,s),Pd(r,e,s),Ac;Kd()}t=Bc(e,t,n)}else e=o.treeContext,ta=lm(s.nextSibling),ea=t,U=!0,na=null,ra=!1,e!==null&&$i(t,e),t=zc(t,r),t.flags|=134221824;return t}return e=ji(e.child,{mode:r.mode,children:r.children}),e.ref=t.ref,t.child=e,e.return=t,e}function Hc(e,t){var n=t.ref;if(n===null)e!==null&&e.ref!==null&&(t.flags|=4194816);else{if(typeof n!=`function`&&typeof n!=`object`)throw Error(i(284));(e===null||e.ref!==n)&&(t.flags|=4194816)}}function Uc(e,t,n,r,i){return xa(t),n=Xo(e,t,n,r,void 0,i),r=es(),e!==null&&!jc?(ts(e,t,i),sl(e,t,i)):(U&&r&&Zi(t),t.flags|=1,Mc(e,t,n,i),t.child)}function Wc(e,t,n,r,i,a){return xa(t),t.updateQueue=null,n=Qo(t,r,n,i),Zo(e),r=es(),e!==null&&!jc?(ts(e,t,a),sl(e,t,a)):(U&&r&&Zi(t),t.flags|=1,Mc(e,t,n,a),t.child)}function Gc(e,t,n,r,i){if(xa(t),t.stateNode===null){var a=Di,o=n.contextType;typeof o==`object`&&o&&(a=Sa(o)),a=new n(r,a),t.memoizedState=a.state!==null&&a.state!==void 0?a.state:null,a.updater=_c,t.stateNode=a,a._reactInternals=t,a=t.stateNode,a.props=r,a.state=t.memoizedState,a.refs={},fo(t),o=n.contextType,a.context=typeof o==`object`&&o?Sa(o):Di,a.state=t.memoizedState,o=n.getDerivedStateFromProps,typeof o==`function`&&(gc(t,n,o,r),a.state=t.memoizedState),typeof n.getDerivedStateFromProps==`function`||typeof a.getSnapshotBeforeUpdate==`function`||typeof a.UNSAFE_componentWillMount!=`function`&&typeof a.componentWillMount!=`function`||(o=a.state,typeof a.componentWillMount==`function`&&a.componentWillMount(),typeof a.UNSAFE_componentWillMount==`function`&&a.UNSAFE_componentWillMount(),o!==a.state&&_c.enqueueReplaceState(a,a.state,null),bo(t,r,a,i),yo(),a.state=t.memoizedState),typeof a.componentDidMount==`function`&&(t.flags|=4194308),r=!0}else if(e===null){a=t.stateNode;var s=t.memoizedProps,c=bc(n,s);a.props=c;var l=a.context,u=n.contextType;o=Di,typeof u==`object`&&u&&(o=Sa(u));var d=n.getDerivedStateFromProps;u=typeof d==`function`||typeof a.getSnapshotBeforeUpdate==`function`,s=t.pendingProps!==s,u||typeof a.UNSAFE_componentWillReceiveProps!=`function`&&typeof a.componentWillReceiveProps!=`function`||(s||l!==o)&&yc(t,a,r,o),uo=!1;var f=t.memoizedState;a.state=f,bo(t,r,a,i),yo(),l=t.memoizedState,s||f!==l||uo?(typeof d==`function`&&(gc(t,n,d,r),l=t.memoizedState),(c=uo||vc(t,n,c,r,f,l,o))?(u||typeof a.UNSAFE_componentWillMount!=`function`&&typeof a.componentWillMount!=`function`||(typeof a.componentWillMount==`function`&&a.componentWillMount(),typeof a.UNSAFE_componentWillMount==`function`&&a.UNSAFE_componentWillMount()),typeof a.componentDidMount==`function`&&(t.flags|=4194308)):(typeof a.componentDidMount==`function`&&(t.flags|=4194308),t.memoizedProps=r,t.memoizedState=l),a.props=r,a.state=l,a.context=o,r=c):(typeof a.componentDidMount==`function`&&(t.flags|=4194308),r=!1)}else{a=t.stateNode,po(e,t),o=t.memoizedProps,u=bc(n,o),a.props=u,d=t.pendingProps,f=a.context,l=n.contextType,c=Di,typeof l==`object`&&l&&(c=Sa(l)),s=n.getDerivedStateFromProps,(l=typeof s==`function`||typeof a.getSnapshotBeforeUpdate==`function`)||typeof a.UNSAFE_componentWillReceiveProps!=`function`&&typeof a.componentWillReceiveProps!=`function`||(o!==d||f!==c)&&yc(t,a,r,c),uo=!1,f=t.memoizedState,a.state=f,bo(t,r,a,i),yo();var p=t.memoizedState;o!==d||f!==p||uo||e!==null&&e.dependencies!==null&&ba(e.dependencies)?(typeof s==`function`&&(gc(t,n,s,r),p=t.memoizedState),(u=uo||vc(t,n,u,r,f,p,c)||e!==null&&e.dependencies!==null&&ba(e.dependencies))?(l||typeof a.UNSAFE_componentWillUpdate!=`function`&&typeof a.componentWillUpdate!=`function`||(typeof a.componentWillUpdate==`function`&&a.componentWillUpdate(r,p,c),typeof a.UNSAFE_componentWillUpdate==`function`&&a.UNSAFE_componentWillUpdate(r,p,c)),typeof a.componentDidUpdate==`function`&&(t.flags|=4),typeof a.getSnapshotBeforeUpdate==`function`&&(t.flags|=1024)):(typeof a.componentDidUpdate!=`function`||o===e.memoizedProps&&f===e.memoizedState||(t.flags|=4),typeof a.getSnapshotBeforeUpdate!=`function`||o===e.memoizedProps&&f===e.memoizedState||(t.flags|=1024),t.memoizedProps=r,t.memoizedState=p),a.props=r,a.state=p,a.context=c,r=u):(typeof a.componentDidUpdate!=`function`||o===e.memoizedProps&&f===e.memoizedState||(t.flags|=4),typeof a.getSnapshotBeforeUpdate!=`function`||o===e.memoizedProps&&f===e.memoizedState||(t.flags|=1024),r=!1)}return a=r,Hc(e,t),r=!!(t.flags&128),a||r?(a=t.stateNode,n=r&&typeof n.getDerivedStateFromError!=`function`?null:a.render(),t.flags|=1,e!==null&&r?(t.child=co(t,e.child,null,i),t.child=co(t,null,n,i)):Mc(e,t,n,i),t.memoizedState=a.state,e=t.child):e=sl(e,t,i),e}function Kc(e,t,n,r){return la(),t.flags|=256,Mc(e,t,n,r),t.child}var qc={dehydrated:null,treeContext:null,retryLane:0,hydrationErrors:null};function Jc(e){return{baseLanes:e,cachePool:Ga()}}function Yc(e,t,n){return e=e===null?0:e.childLanes&~n,t&&(e|=ld),e}function Xc(e,t,n){var r=t.pendingProps,i=!1,a=!!(t.flags&128),o;if((o=a)||(o=e!==null&&e.memoizedState===null?!1:!!(Fo.current&2)),o&&(i=!0,t.flags&=-129),o=!!(t.flags&32),t.flags&=-33,e===null){if(U){if(i?Ao(t):No(),(e=ta)?(e=am(e,ra),e=e!==null&&e.data!==`&`?e:null,e!==null&&(t.memoizedState={dehydrated:e,treeContext:Ki===null?null:{id:qi,overflow:Ji},retryLane:536870912,hydrationErrors:null},n=Ii(e),n.return=t,t.child=n,ea=t,ta=null)):e=null,e===null)throw aa(t);return t.lanes=sm(e)?32:536870912,null}return a=r.children,r=r.fallback,i?(No(),i=t.mode,a=Qc({mode:`hidden`,children:a},i),r=Pi(r,i,n,null),a.return=t,r.return=t,a.sibling=r,t.child=a,r=t.child,r.memoizedState=Jc(n),r.childLanes=Yc(e,o,n),t.memoizedState=qc,Lc(null,r)):(Ao(t),Zc(t,a))}var s=e.memoizedState;if(s!==null){var c=s.dehydrated;if(c!==null)return el(e,t,a,o,r,c,s,n)}return i?(No(),i=r.fallback,a=t.mode,s=e.child,c=s.sibling,r=ji(s,{mode:`hidden`,children:r.children}),r.subtreeFlags=s.subtreeFlags&1206910976,c===null?(i=Pi(i,a,n,null),i.flags|=2):i=ji(c,i),i.return=t,r.return=t,r.sibling=i,t.child=r,Lc(null,r),r=t.child,i=e.child.memoizedState,i===null?i=Jc(n):(a=i.cachePool,a===null?a=Ga():(s=Oa._currentValue,a=a.parent===s?a:{parent:s,pool:s}),i={baseLanes:i.baseLanes|n,cachePool:a}),r.memoizedState=i,r.childLanes=Yc(e,o,n),t.memoizedState=qc,Lc(e.child,r)):(Ao(t),n=e.child,e=n.sibling,n=ji(n,{mode:`visible`,children:r.children}),n.return=t,n.sibling=null,e!==null&&(o=t.deletions,o===null?(t.deletions=[e],t.flags|=16):o.push(e)),t.child=n,t.memoizedState=null,n)}function Zc(e,t){return t=Qc({mode:`visible`,children:t},e.mode),t.return=e,e.child=t}function Qc(e,t){return e=ki(22,e,null,t),e.lanes=0,e}function $c(e,t,n){return co(t,e.child,null,n),e=Zc(t,t.pendingProps.children),e.flags|=2,t.memoizedState=null,e}function el(e,t,n,r,a,o,s,c){if(n)return t.flags&256?(Ao(t),t.flags&=-257,$c(e,t,c)):t.memoizedState===null?(No(),o=a.fallback,s=t.mode,a=Qc({mode:`visible`,children:a.children},s),o=Pi(o,s,c,null),o.flags|=2,a.return=t,o.return=t,a.sibling=o,t.child=a,co(t,e.child,null,c),a=t.child,a.memoizedState=Jc(c),a.childLanes=Yc(e,r,c),t.memoizedState=qc,Lc(null,a)):(No(),t.child=e.child,t.flags|=128,null);if(Ao(t),sm(o)){if(r=o.nextSibling&&o.nextSibling.dataset,r)var l=r.dgst;return r=l,r!==``&&(a=Error(i(419)),a.stack=``,a.digest=r,da({value:a,source:null,stack:null})),$c(e,t,c)}if(jc||ya(e,t,c,!1),r=(c&e.childLanes)!==0,jc||r){if(Co.current!==null)return $c(e,t,c);if(r=$u,r!==null&&(a=mt(r,c),a!==0&&a!==s.retryLane))throw s.retryLane=a,wi(e,a),Pd(r,e,a),Ac;return om(o)||Kd(),$c(e,t,c)}return om(o)?(t.flags|=192,t.child=e.child,null):(e=s.treeContext,ta=lm(o.nextSibling),ea=t,U=!0,na=null,ra=!1,e!==null&&$i(t,e),t=Zc(t,a.children),t.flags|=134221824,t)}function tl(e,t,n){e.lanes|=t;var r=e.alternate;r!==null&&(r.lanes|=t),_a(e.return,t,n)}function nl(e){for(var t=null;e!==null;){var n=e.alternate;n!==null&&Ro(n)===null&&(t=e),e=e.sibling}return t}function rl(e,t,n,r,i,a){var o=e.memoizedState;o===null?e.memoizedState={isBackwards:t,rendering:null,renderingStartTime:0,last:r,tail:n,tailMode:i,treeForkCount:a}:(o.isBackwards=t,o.rendering=null,o.renderingStartTime=0,o.last=r,o.tail=n,o.tailMode=i,o.treeForkCount=a)}function il(e){var t=e.child;for(e.child=null;t!==null;){var n=t.sibling;t.sibling=e.child,e.child=t,t=n}}function al(e,t,n){var r=t.pendingProps,i=r.revealOrder,a=r.tail;r=r.children;var o=Fo.current;if(t.flags&128)return Io(t,o),null;var s=!!(o&2);if(s?(o=o&1|2,t.flags|=128):o&=1,Io(t,o),i===`backwards`&&e!==null?(il(e),Mc(e,t,r,n),il(e)):Mc(e,t,r,n),r=U?Ui:0,!s&&e!==null&&e.flags&128)a:for(e=t.child;e!==null;){if(e.tag===13)e.memoizedState!==null&&tl(e,n,t);else if(e.tag===19)tl(e,n,t);else if(e.child!==null){e.child.return=e,e=e.child;continue}if(e===t)break a;for(;e.sibling===null;){if(e.return===null||e.return===t)break a;e=e.return}e.sibling.return=e.return,e=e.sibling}switch(i){case`backwards`:n=nl(t.child),n===null?(i=t.child,t.child=null):(i=n.sibling,n.sibling=null,il(t)),rl(t,!0,i,null,a,r);break;case`unstable_legacy-backwards`:for(n=null,i=t.child,t.child=null;i!==null;){if(e=i.alternate,e!==null&&Ro(e)===null){t.child=i;break}e=i.sibling,i.sibling=n,n=i,i=e}rl(t,!0,n,null,a,r);break;case`together`:rl(t,!1,null,null,void 0,r);break;case`independent`:t.memoizedState=null;break;default:n=nl(t.child),n===null?(i=t.child,t.child=null):(i=n.sibling,n.sibling=null),rl(t,!1,i,n,a,r)}return t.child}function ol(e,t,n){var r=t.pendingProps;return ha(t,t.type,r.value),Mc(e,t,r.children,n),t.child}function sl(e,t,n){if(e!==null&&(t.dependencies=e.dependencies),od|=t.lanes,(n&t.childLanes)===0){if(e!==null){if(ya(e,t,n,!1),(n&t.childLanes)===0)return null}else return null}if(e!==null&&t.child!==e.child)throw Error(i(153));if(t.child!==null){for(e=t.child,n=ji(e,e.pendingProps),t.child=n,n.return=t;e.sibling!==null;)e=e.sibling,n=n.sibling=ji(e,e.pendingProps),n.return=t;n.sibling=null}return t.child}function cl(e,t){return(e.lanes&t)!==0||(e=e.dependencies,!!(e!==null&&ba(e)))}function ll(e,t,n){switch(t.tag){case 3:Se(t,t.stateNode.containerInfo),ha(t,Oa,e.memoizedState.cache),la();break;case 27:case 5:we(t);break;case 4:Se(t,t.stateNode.containerInfo);break;case 10:ha(t,t.type,t.memoizedProps.value);break;case 31:if(t.memoizedState!==null)return t.flags|=128,jo(t),null;break;case 13:var r=t.memoizedState;if(r!==null){if(r.dehydrated!==null)return Ao(t),t.flags|=128,null;r=ya(e,t,n,!1);var i=t.child.childLanes;return r||(n&i)!==0?Xc(e,t,n):(Ao(t),e=sl(e,t,n),e===null?null:e.sibling)}Ao(t);break;case 19:if(t.flags&128)return al(e,t,n);if(i=!!(e.flags&128),r=(n&t.childLanes)!==0,r||=(ya(e,t,n,!1),(n&t.childLanes)!==0),i){if(r)return al(e,t,n);t.flags|=128}if(i=t.memoizedState,i!==null&&(i.rendering=null,i.tail=null,i.lastEffect=null),Io(t,Fo.current),r)break;return null;case 22:return t.lanes=0,Ic(e,t,n,t.pendingProps);case 24:ha(t,Oa,e.memoizedState.cache)}return sl(e,t,n)}function ul(e,t,n){if(e!==null){if(e.memoizedProps!==t.pendingProps)jc=!0;else{if(!cl(e,n)&&!(t.flags&128))return jc=!1,ll(e,t,n);jc=!!(e.flags&131072)}}else jc=!1,U&&t.flags&1048576&&Xi(t,Ui,t.index);switch(t.lanes=0,t.tag){case 16:a:{var r=t.pendingProps;if(e=Qa(t.elementType),t.type=e,typeof e==`function`)Ai(e)?(r=bc(e,r),t.tag=1,t=Gc(null,t,e,r,n)):(t.tag=0,t=Uc(null,t,e,r,n));else{if(e!=null){var a=e.$$typeof;if(a===I){t.tag=11,t=Nc(null,t,e,r,n);break a}if(a===te){t.tag=14,t=Pc(null,t,e,r,n);break a}if(a===F){t.tag=10,t.type=e,t=ol(null,t,n);break a}}throw t=de(e)||e,Error(i(306,t,``))}}return t;case 0:return Uc(e,t,t.type,t.pendingProps,n);case 1:return r=t.type,a=bc(r,t.pendingProps),Gc(e,t,r,a,n);case 3:a:{if(Se(t,t.stateNode.containerInfo),e===null)throw Error(i(387));r=t.pendingProps;var o=t.memoizedState;a=o.element,po(e,t),bo(t,r,null,n);var s=t.memoizedState;if(r=s.cache,ha(t,Oa,r),r!==o.cache&&va(t,[Oa],n,!0),yo(),r=s.element,o.isDehydrated){if(o={element:r,isDehydrated:!1,cache:s.cache},t.updateQueue.baseState=o,t.memoizedState=o,t.flags&256){t=Kc(e,t,r,n);break a}if(r!==a){a=zi(Error(i(424)),t),da(a),t=Kc(e,t,r,n);break a}switch(e=t.stateNode.containerInfo,e.nodeType){case 9:e=e.body;break;default:e=e.nodeName===`HTML`?e.ownerDocument.body:e}for(ta=lm(e.firstChild),ea=t,U=!0,na=null,ra=!0,n=lo(t,null,r,n),t.child=n;n;)n.flags=n.flags&-3|134221824,n=n.sibling}else{if(la(),r===a){t=sl(e,t,n);break a}Mc(e,t,r,n)}t=t.child}return t;case 26:return Hc(e,t),e===null?(n=Nm(t.type,null,t.pendingProps,null))?t.memoizedState=n:U||(t.stateNode=fp(t.type,t.pendingProps,be.current,t)):t.memoizedState=Nm(t.type,e.memoizedProps,t.pendingProps,e.memoizedState),null;case 27:return we(t),e===null&&U&&(r=t.stateNode=hm(t.type,t.pendingProps,be.current),ea=t,ra=!0,a=ta,Sp(t.type)?(um=a,ta=lm(r.firstChild)):ta=a),Mc(e,t,t.pendingProps.children,n),Hc(e,t),e===null&&(t.flags|=4194304),t.child;case 5:return e===null&&U&&((a=r=ta)&&(r=rm(r,t.type,t.pendingProps,ra),r===null?a=!1:(t.stateNode=r,ea=t,ta=lm(r.firstChild),ra=!1,a=!0)),a||aa(t)),we(t),a=t.type,o=t.pendingProps,s=e===null?null:e.memoizedProps,r=o.children,pp(a,o)?r=null:s!==null&&pp(a,s)&&(t.flags|=32),t.memoizedState!==null&&(a=Xo(e,t,$o,null,null,n),sh._currentValue=a),Hc(e,t),Mc(e,t,r,n),t.child;case 6:return e===null&&U&&((e=n=ta)&&(n=im(n,t.pendingProps,ra),n===null?e=!1:(t.stateNode=n,ea=t,ta=null,e=!0)),e||aa(t)),null;case 13:return Xc(e,t,n);case 4:return Se(t,t.stateNode.containerInfo),r=t.pendingProps,e===null?t.child=co(t,null,r,n):Mc(e,t,r,n),t.child;case 11:return Nc(e,t,t.type,t.pendingProps,n);case 7:return r=t.pendingProps,Hc(e,t),Mc(e,t,r,n),t.child;case 8:return Mc(e,t,t.pendingProps.children,n),t.child;case 12:return Mc(e,t,t.pendingProps.children,n),t.child;case 10:return ol(e,t,n);case 9:return a=t.type._context,r=t.pendingProps.children,xa(t),a=Sa(a),r=r(a),t.flags|=1,Mc(e,t,r,n),t.child;case 14:return Pc(e,t,t.type,t.pendingProps,n);case 15:return Fc(e,t,t.type,t.pendingProps,n);case 19:return al(e,t,n);case 31:return Vc(e,t,n);case 22:return Ic(e,t,n,t.pendingProps);case 24:return xa(t),r=Sa(Oa),e===null?(a=Ua(),a===null&&(a=$u,o=ka(),a.pooledCache=o,o.refCount++,o!==null&&(a.pooledCacheLanes|=n),a=o),t.memoizedState={parent:r,cache:a},fo(t),ha(t,Oa,a)):((e.lanes&n)!==0&&(po(e,t),bo(t,null,null,n),yo()),a=e.memoizedState,o=t.memoizedState,a.parent===r?(r=o.cache,ha(t,Oa,r),r!==a.cache&&va(t,[Oa],n,!0)):(a={parent:r,cache:r},t.memoizedState=a,t.lanes===0&&(t.memoizedState=t.updateQueue.baseState=a),ha(t,Oa,r))),Mc(e,t,t.pendingProps.children,n),t.child;case 30:return t.stateNode===null&&(t.stateNode={autoName:null,paired:null,clones:null,ref:null}),r=t.pendingProps,r.name!=null&&r.name!==`auto`?t.flags|=e===null?18882560:18874368:U&&Zi(t),e!==null&&e.memoizedProps.name!==r.name?t.flags|=4194816:Hc(e,t),Mc(e,t,r.children,n),t.child;case 29:throw t.pendingProps}throw Error(i(156,t.tag))}function dl(e){e.flags|=4}function fl(e,t,n,r,i){var a;if((a=!!(e.mode&32))&&(a=n===null?Jm(t,r):Jm(t,r)&&(r.src!==n.src||r.srcSet!==n.srcSet)),a){if(e.flags|=16777216,(i&335544128)===i){if(e.stateNode.complete)e.flags|=8192;else if(Ud())e.flags|=8192;else throw $a=Ya,qa}}else e.flags&=-16777217}function pl(e,t){if(t.type!==`stylesheet`||t.state.loading&4)e.flags&=-16777217;else if(e.flags|=16777216,!Ym(t)){if(Ud())e.flags|=8192;else throw $a=Ya,qa}}function ml(e,t){t!==null&&(e.flags|=4),e.flags&16384&&(t=e.tag===22?536870912:ct(),e.lanes|=t,ud|=t)}function hl(e,t){if(!U)switch(e.tailMode){case`visible`:break;case`collapsed`:for(var n=e.tail,r=null;n!==null;)n.alternate!==null&&(r=n),n=n.sibling;r===null?t||e.tail===null?e.tail=null:e.tail.sibling=null:r.sibling=null;break;default:for(t=e.tail,n=null;t!==null;)t.alternate!==null&&(n=t),t=t.sibling;n===null?e.tail=null:n.sibling=null}}function gl(e){var t=e.alternate!==null&&e.alternate.child===e.child,n=0,r=0;if(t)for(var i=e.child;i!==null;)n|=i.lanes|i.childLanes,r|=i.subtreeFlags&1206910976,r|=i.flags&1206910976,i.return=e,i=i.sibling;else for(i=e.child;i!==null;)n|=i.lanes|i.childLanes,r|=i.subtreeFlags,r|=i.flags,i.return=e,i=i.sibling;return e.subtreeFlags|=r,e.childLanes=n,t}function _l(e,t,n){var r=t.pendingProps;switch(Qi(t),t.tag){case 16:case 15:case 0:case 11:case 7:case 8:case 12:case 9:case 14:return gl(t),null;case 1:return gl(t),null;case 3:return n=t.stateNode,r=null,e!==null&&(r=e.memoizedState.cache),t.memoizedState.cache!==r&&(t.flags|=2048),ga(Oa),Ce(),n.pendingContext&&(n.context=n.pendingContext,n.pendingContext=null),(e===null||e.child===null)&&(ca(t)?dl(t):e===null||e.memoizedState.isDehydrated&&!(t.flags&256)||(t.flags|=1024,ua())),gl(t),null;case 26:var a=t.type,o=t.memoizedState;return e===null?(dl(t),o===null?(gl(t),fl(t,a,null,r,n)):(gl(t),pl(t,o))):o?o===e.memoizedState?(gl(t),t.flags&=-16777217):(dl(t),gl(t),pl(t,o)):(e=e.memoizedProps,e!==r&&dl(t),gl(t),fl(t,a,e,r,n)),null;case 27:if(Te(t),n=be.current,a=t.type,e!==null&&t.stateNode!=null)e.memoizedProps!==r&&dl(t);else{if(!r){if(t.stateNode===null)throw Error(i(166));return gl(t),t.subtreeFlags&=-33554433,null}e=ve.current,ca(t)?oa(t,e):(e=hm(a,r,n),t.stateNode=e,dl(t))}return gl(t),t.subtreeFlags&=-33554433,null;case 5:if(Te(t),a=t.type,e!==null&&t.stateNode!=null)e.memoizedProps!==r&&dl(t);else{if(!r){if(t.stateNode===null)throw Error(i(166));return gl(t),t.subtreeFlags&=-33554433,null}if(o=ve.current,ca(t))oa(t,o);else{var s=lp(be.current);switch(o){case 1:o=s.createElementNS(`http://www.w3.org/2000/svg`,a);break;case 2:o=s.createElementNS(`http://www.w3.org/1998/Math/MathML`,a);break;default:switch(a){case`svg`:o=s.createElementNS(`http://www.w3.org/2000/svg`,a);break;case`math`:o=s.createElementNS(`http://www.w3.org/1998/Math/MathML`,a);break;case`script`:o=s.createElement(`div`),o.innerHTML=`<script><\/script>`,o=o.removeChild(o.firstChild);break;case`select`:o=typeof r.is==`string`?s.createElement(`select`,{is:r.is}):s.createElement(`select`),r.multiple?o.multiple=!0:r.size&&(o.size=r.size);break;default:o=typeof r.is==`string`?s.createElement(a,{is:r.is}):s.createElement(a)}}o[bt]=t,o[xt]=r;a:for(s=t.child;s!==null;){if(s.tag===5||s.tag===6)o.appendChild(s.stateNode);else if(s.tag!==4&&s.tag!==27&&s.child!==null){s.child.return=s,s=s.child;continue}if(s===t)break a;for(;s.sibling===null;){if(s.return===null||s.return===t)break a;s=s.return}s.sibling.return=s.return,s=s.sibling}t.stateNode=o;a:switch(np(o,a,r),a){case`button`:case`input`:case`select`:case`textarea`:r=!!r.autoFocus;break a;case`img`:r=!0;break a;default:r=!1}r&&dl(t)}}return gl(t),t.subtreeFlags&=-33554433,fl(t,t.type,e===null?null:e.memoizedProps,t.pendingProps,n),null;case 6:if(e&&t.stateNode!=null)e.memoizedProps!==r&&dl(t);else{if(typeof r!=`string`&&t.stateNode===null)throw Error(i(166));if(e=be.current,ca(t)){if(e=t.stateNode,n=t.memoizedProps,r=null,a=ea,a!==null)switch(a.tag){case 27:case 5:r=a.memoizedProps}e[bt]=t,e=!!(e.nodeValue===n||r!==null&&!0===r.suppressHydrationWarning||ep(e.nodeValue,n)),e||aa(t,!0)}else e=lp(e).createTextNode(r),e[bt]=t,t.stateNode=e}return gl(t),null;case 31:if(n=t.memoizedState,e===null||e.memoizedState!==null){if(r=ca(t),n!==null){if(e===null){if(!r)throw Error(i(318));if(e=t.memoizedState,e=e===null?null:e.dehydrated,!e)throw Error(i(557));e[bt]=t}else la(),!(t.flags&128)&&(t.memoizedState=null),t.flags|=4;gl(t),e=!1}else n=ua(),e!==null&&e.memoizedState!==null&&(e.memoizedState.hydrationErrors=n),e=!0;if(!e)return t.flags&256?(Po(t),t):(Po(t),null);if(t.flags&128)throw Error(i(558))}return gl(t),null;case 13:if(r=t.memoizedState,e===null||e.memoizedState!==null&&e.memoizedState.dehydrated!==null){if(a=ca(t),r!==null&&r.dehydrated!==null){if(e===null){if(!a)throw Error(i(318));if(a=t.memoizedState,a=a===null?null:a.dehydrated,!a)throw Error(i(317));a[bt]=t}else la(),!(t.flags&128)&&(t.memoizedState=null),t.flags|=4;gl(t),a=!1}else a=ua(),e!==null&&e.memoizedState!==null&&(e.memoizedState.hydrationErrors=a),a=!0;if(!a)return t.flags&256?(Po(t),t):(Po(t),null)}return Po(t),t.flags&128?(t.lanes=n,t):(n=r!==null,e=e!==null&&e.memoizedState!==null,n&&(r=t.child,a=null,r.alternate!==null&&r.alternate.memoizedState!==null&&r.alternate.memoizedState.cachePool!==null&&(a=r.alternate.memoizedState.cachePool.pool),o=null,r.memoizedState!==null&&r.memoizedState.cachePool!==null&&(o=r.memoizedState.cachePool.pool),o!==a&&(r.flags|=2048)),n!==e&&n&&(t.child.flags|=8192),ml(t,t.updateQueue),gl(t),null);case 4:return Ce(),e===null&&Wf(t.stateNode.containerInfo),t.flags|=67108864,gl(t),null;case 10:return ga(t.type),gl(t),null;case 19:if(Lo(t),r=t.memoizedState,r===null)return gl(t),null;if(a=!!(t.flags&128),o=r.rendering,o===null){if(a)hl(r,!1);else{if(ad!==0||e!==null&&e.flags&128)for(e=t.child;e!==null;){if(o=Ro(e),o!==null){for(t.flags|=128,hl(r,!1),e=o.updateQueue,t.updateQueue=e,ml(t,e),t.subtreeFlags=0,e=n,n=t.child;n!==null;)Mi(n,e),n=n.sibling;return Io(t,Fo.current&1|2),U&&Yi(t,r.treeForkCount),t.child}e=e.sibling}r.tail!==null&&Re()>gd&&(t.flags|=128,a=!0,hl(r,!1),t.lanes=4194304)}}else{if(!a){if(e=Ro(o),e!==null){if(t.flags|=128,a=!0,e=e.updateQueue,t.updateQueue=e,ml(t,e),hl(r,!0),r.tail===null&&r.tailMode!==`collapsed`&&r.tailMode!==`visible`&&!o.alternate&&!U)return gl(t),null}else 2*Re()-r.renderingStartTime>gd&&n!==536870912&&(t.flags|=128,a=!0,hl(r,!1),t.lanes=4194304)}r.isBackwards?(o.sibling=t.child,t.child=o):(e=r.last,e===null?t.child=o:e.sibling=o,r.last=o)}if(r.tail!==null){e=r.tail;a:{for(n=e;n!==null;){if(n.alternate!==null){n=!1;break a}n=n.sibling}n=!0}return r.rendering=e,r.tail=e.sibling,r.renderingStartTime=Re(),e.sibling=null,o=Fo.current,o=a?o&1|2:o&1,r.tailMode===`visible`||r.tailMode===`collapsed`||!n||U?Io(t,o):(n=o,B(Oo,t),B(Fo,n),ko===null&&(ko=t)),U&&Yi(t,r.treeForkCount),e}return gl(t),null;case 22:case 23:return Po(t),Do(),r=t.memoizedState!==null,e===null?r&&(t.flags|=8192):e.memoizedState!==null!==r&&(t.flags|=8192),r?n&536870912&&!(t.flags&128)&&(gl(t),t.subtreeFlags&6&&(t.flags|=8192)):gl(t),n=t.updateQueue,n!==null&&ml(t,n.retryQueue),n=null,e!==null&&e.memoizedState!==null&&e.memoizedState.cachePool!==null&&(n=e.memoizedState.cachePool.pool),r=null,t.memoizedState!==null&&t.memoizedState.cachePool!==null&&(r=t.memoizedState.cachePool.pool),r!==n&&(t.flags|=2048),e!==null&&_e(Ha),null;case 24:return n=null,e!==null&&(n=e.memoizedState.cache),t.memoizedState.cache!==n&&(t.flags|=2048),ga(Oa),gl(t),null;case 25:return null;case 30:return t.flags|=33554432,gl(t),null}throw Error(i(156,t.tag))}function vl(e,t){switch(Qi(t),t.tag){case 1:return e=t.flags,e&65536?(t.flags=e&-65537|128,t):null;case 3:return ga(Oa),Ce(),e=t.flags,e&65536&&!(e&128)?(t.flags=e&-65537|128,t):null;case 26:case 27:case 5:return Te(t),null;case 31:if(t.memoizedState!==null){if(Po(t),t.alternate===null)throw Error(i(340));la()}return e=t.flags,e&65536?(t.flags=e&-65537|128,t):null;case 13:if(Po(t),e=t.memoizedState,e!==null&&e.dehydrated!==null){if(t.alternate===null)throw Error(i(340));la()}return e=t.flags,e&65536?(t.flags=e&-65537|128,t):null;case 19:return Lo(t),e=t.flags,e&65536?(t.flags=e&-65537|128,e=t.memoizedState,e!==null&&(e.rendering=null,e.tail=null),t.flags|=4,t):null;case 4:return Ce(),null;case 10:return ga(t.type),null;case 22:case 23:return Po(t),Do(),e!==null&&_e(Ha),e=t.flags,e&65536?(t.flags=e&-65537|128,t):null;case 24:return ga(Oa),null;case 25:return null;default:return null}}function yl(e,t){switch(Qi(t),t.tag){case 3:ga(Oa),Ce();break;case 26:case 27:case 5:Te(t);break;case 4:Ce();break;case 31:t.memoizedState!==null&&Po(t);break;case 13:Po(t);break;case 19:Lo(t);break;case 10:ga(t.type);break;case 22:case 23:Po(t),Do(),e!==null&&_e(Ha);break;case 24:ga(Oa)}}function bl(e,t){try{var n=t.updateQueue,r=n===null?null:n.lastEffect;if(r!==null){var i=r.next;n=i;do{if((n.tag&e)===e){r=void 0;var a=n.create,o=n.inst;r=a(),o.destroy=r}n=n.next}while(n!==i)}}catch(e){Z(t,t.return,e)}}function xl(e,t,n){try{var r=t.updateQueue,i=r===null?null:r.lastEffect;if(i!==null){var a=i.next;r=a;do{if((r.tag&e)===e){var o=r.inst,s=o.destroy;if(s!==void 0){o.destroy=void 0,i=t;var c=n,l=s;try{l()}catch(e){Z(i,c,e)}}}r=r.next}while(r!==a)}}catch(e){Z(t,t.return,e)}}function Sl(e){var t=e.updateQueue;if(t!==null){var n=e.stateNode;try{So(t,n)}catch(t){Z(e,e.return,t)}}}function Cl(e,t,n){n.props=bc(e.type,e.memoizedProps),n.state=e.memoizedState;try{n.componentWillUnmount()}catch(n){Z(e,t,n)}}function wl(e,t){try{var n=e.ref;if(n!==null){switch(e.tag){case 26:case 27:case 5:var r=e.stateNode;break;case 30:var i=e.stateNode,a=mi(e.memoizedProps,i);(i.ref===null||i.ref.name!==a)&&(i.ref=Pp(a)),r=i.ref;break;case 7:if(e.stateNode===null){var o=new Fp(e);h(e.child,!1,Qp,o,void 0,void 0),e.stateNode=o}r=e.stateNode;break;default:r=e.stateNode}typeof n==`function`?e.refCleanup=n(r):n.current=r}}catch(n){Z(e,t,n)}}function Tl(e,t){var n=e.ref,r=e.refCleanup;if(n!==null){if(typeof r==`function`)try{r()}catch(n){Z(e,t,n)}finally{e.refCleanup=null,e=e.alternate,e!=null&&(e.refCleanup=null)}else if(typeof n==`function`)try{n(null)}catch(n){Z(e,t,n)}else n.current=null}}function El(e,t){if((e.tag===5||e.tag===27||e.tag===6)&&e.alternate===null&&t!==null)for(var n=0;n<t.length;n++)em(e.stateNode,t[n])}function Dl(e){for(var t=e.return;t!==null&&(Al(t)&&em(e.stateNode,t.stateNode),!kl(t));)t=t.return}function Ol(e){for(var t=e.return;t!==null&&(Al(t)&&tm(e.stateNode,t.stateNode),!kl(t));)t=t.return}function kl(e){return e.tag===5||e.tag===3||e.tag===27}function Al(e){return e&&e.tag===7&&e.stateNode!==null}function jl(e){var t=e.type,n=e.memoizedProps,r=e.stateNode;try{a:switch(t){case`button`:case`input`:case`select`:case`textarea`:n.autoFocus&&r.focus();break a;case`img`:n.src?r.src=n.src:n.srcSet&&(r.srcset=n.srcSet)}}catch(t){Z(e,e.return,t)}}function Ml(e,t,n){try{var r=e.stateNode;ip(r,e.type,n,t),r[xt]=t}catch(t){Z(e,e.return,t)}}function Nl(e){return e.tag===5||e.tag===3||e.tag===26||e.tag===27&&Sp(e.type)||e.tag===4}function Pl(e){a:for(;;){for(;e.sibling===null;){if(e.return===null||Nl(e.return))return null;e=e.return}for(e.sibling.return=e.return,e=e.sibling;e.tag!==5&&e.tag!==6&&e.tag!==18;){if(e.tag===27&&Sp(e.type)||e.flags&2||e.child===null||e.tag===4)continue a;e.child.return=e,e=e.child}if(!(e.flags&2))return e.stateNode}}function Fl(e,t,n,r){var i=e.tag;if(i===5||i===6)i=e.stateNode,t?(n.nodeType===9?n.body:n.nodeName===`HTML`?n.ownerDocument.body:n).insertBefore(i,t):(t=n.nodeType===9?n.body:n.nodeName===`HTML`?n.ownerDocument.body:n,t.appendChild(i),n=n._reactRootContainer,n!=null||t.onclick!==null||(t.onclick=gn)),El(e,r),V=!0;else if(i!==4&&(i===27&&(El(e,r),r=null,Sp(e.type)&&(n=e.stateNode,t=null)),e=e.child,e!==null))for(Fl(e,t,n,r),e=e.sibling;e!==null;)Fl(e,t,n,r),e=e.sibling}function Il(e,t,n,r){var i=e.tag;if(i===5||i===6)i=e.stateNode,t?n.insertBefore(i,t):n.appendChild(i),El(e,r),V=!0;else if(i!==4&&(i===27&&(El(e,r),r=null,Sp(e.type)&&(n=e.stateNode)),e=e.child,e!==null))for(Il(e,t,n,r),e=e.sibling;e!==null;)Il(e,t,n,r),e=e.sibling}function Ll(e){var t=e.stateNode,n=e.memoizedProps;try{for(var r=e.type,i=t.attributes;i.length;)t.removeAttributeNode(i[0]);np(t,r,n),t[bt]=e,t[xt]=n}catch(t){Z(e,e.return,t)}}var Rl=!1,zl=null;function Bl(e){(e.tag===30||e.subtreeFlags&33554432)&&(Rl=!0)}var Vl=null;function Hl(){var e=Vl;return Vl=null,e}var Ul=0;function Wl(e,t,n,r,i){return Ul=0,Gl(e.child,t,n,r,i)}function Gl(e,t,n,r,i){for(var a=!1;e!==null;){if(e.tag===5){var o=e.stateNode;if(r!==null){var s=Op(o);r.push(s),s.view&&(a=!0)}else a||Op(o).view&&(a=!0);Rl=!0,Tp(o,Ul===0?t:t+`_`+Ul,n),Ul++}else e.tag===22&&e.memoizedState!==null||e.tag===30&&i||Gl(e.child,t,n,r,i)&&(a=!0);e=e.sibling}return a}function Kl(e,t){for(;e!==null;)e.tag===5?Ep(e.stateNode,e.memoizedProps):e.tag===22&&e.memoizedState!==null||e.tag===30&&t||Kl(e.child,t),e=e.sibling}function ql(e){if(e.subtreeFlags&18874368)for(e=e.child;e!==null;){if((e.tag!==22||e.memoizedState===null)&&(ql(e),e.tag===30&&e.flags&18874368&&e.stateNode.paired)){var t=e.memoizedProps;if(t.name==null||t.name===`auto`)throw Error(i(544));var n=t.name;t=gi(t.default,t.share),t!==`none`&&(Wl(e,n,t,null,!1)||Kl(e.child,!1))}e=e.sibling}}function Jl(e,t){if(e.tag===30){var n=e.stateNode,r=e.memoizedProps,i=mi(r,n),a=gi(r.default,n.paired?r.share:r.enter);a===`none`?ql(e):Wl(e,i,a,null,!1)?(ql(e),n.paired||t||Nd(e,r.onEnter)):Kl(e.child,!1)}else if(e.subtreeFlags&33554432)for(e=e.child;e!==null;)Jl(e,t),e=e.sibling;else ql(e)}function Yl(e){if(zl!==null&&zl.size!==0){var t=zl;if(e.subtreeFlags&18874368)for(e=e.child;e!==null;){if(e.tag!==22||e.memoizedState===null){if(e.tag===30&&e.flags&18874368){var n=e.memoizedProps,r=n.name;if(r!=null&&r!==`auto`){var i=t.get(r);if(i!==void 0){var a=gi(n.default,n.share);if(a!==`none`&&(Wl(e,r,a,null,!1)?(a=e.stateNode,i.paired=a,a.paired=i,Nd(e,n.onShare)):Kl(e.child,!1)),t.delete(r),t.size===0)break}}}Yl(e)}e=e.sibling}}}function Xl(e){if(e.tag===30){var t=e.memoizedProps,n=mi(t,e.stateNode),r=zl===null?void 0:zl.get(n),i=gi(t.default,r===void 0?t.exit:t.share);i!==`none`&&(Wl(e,n,i,null,!1)?r===void 0?Nd(e,t.onExit):(i=e.stateNode,r.paired=i,i.paired=r,zl.delete(n),Nd(e,t.onShare)):Kl(e.child,!1)),zl!==null&&Yl(e)}else if(e.subtreeFlags&33554432)for(e=e.child;e!==null;)Xl(e),e=e.sibling;else zl!==null&&Yl(e)}function Zl(e){for(e=e.child;e!==null;){if(e.tag===30){var t=e.memoizedProps,n=mi(t,e.stateNode);t=gi(t.default,t.update),e.flags&=-5,t!==`none`&&Wl(e,n,t,e.memoizedState=[],!1)}else e.subtreeFlags&33554432&&Zl(e);e=e.sibling}}function Ql(e){if(e.subtreeFlags&18874368)for(e=e.child;e!==null;){if(e.tag!==22||e.memoizedState===null){if(e.tag===30&&e.flags&18874368){var t=e.stateNode;t.paired!==null&&(t.paired=null,Kl(e.child,!1))}Ql(e)}e=e.sibling}}function $l(e){if(e.tag===30)e.stateNode.paired=null,Kl(e.child,!1),Ql(e);else if(e.subtreeFlags&33554432)for(e=e.child;e!==null;)$l(e),e=e.sibling;else Ql(e)}function eu(e){for(e=e.child;e!==null;)e.tag===30?Kl(e.child,!1):e.subtreeFlags&33554432&&eu(e),e=e.sibling}function tu(e,t,n,r,i,a,o){for(var s=!1;t!==null;){if(t.tag===5){var c=t.stateNode;if(a!==null&&Ul<a.length){var l=a[Ul],u=Op(c);(l.view||u.view)&&(s=!0);var d;if(d=!(e.flags&4)){if(u.clip)d=!0;else{d=l.rect;var f=u.rect;d=d.y!==f.y||d.x!==f.x||d.height!==f.height||d.width!==f.width}}d&&(e.flags|=4),u.abs?u=!l.abs:(l=l.rect,u=u.rect,u=l.height!==u.height||l.width!==u.width),u&&(e.flags|=32)}else e.flags|=32;e.flags&4&&Tp(c,Ul===0?n:n+`_`+Ul,i),s&&e.flags&4||(Vl===null&&(Vl=[]),Vl.push(c,Ul===0?r:r+`_`+Ul,t.memoizedProps)),Ul++}else(t.tag!==22||t.memoizedState===null)&&(t.tag===30&&o?e.flags|=t.flags&32:tu(e,t.child,n,r,i,a,o)&&(s=!0));t=t.sibling}return s}function nu(e,t){for(e=e.child;e!==null;){if(e.tag===30){var n=e.memoizedProps,r=e.stateNode,i=mi(n,r),a=gi(n.default,n.update);if(t){r=r.clones;var o=r===null?null:r.map(kp)}else o=e.memoizedState,e.memoizedState=null;r=e;var s=e.child;Ul=0,i=tu(r,s,i,i,a,o,!1),e.flags&4&&i&&(t||Nd(e,n.onUpdate))}else e.subtreeFlags&33554432&&nu(e,t);e=e.sibling}}var ru=!1,K=!1,iu=!1,au=!1,ou=typeof WeakSet==`function`?WeakSet:Set,su=null,cu=!1,lu=!1,uu=!1,du=!1;function fu(e,t,n){if(e=e.containerInfo,sp=gh,e=Wr(e),Gr(e)){if(`selectionStart`in e)var r={start:e.selectionStart,end:e.selectionEnd};else a:{r=(r=e.ownerDocument)&&r.defaultView||window;var i=r.getSelection&&r.getSelection();if(i&&i.rangeCount!==0){r=i.anchorNode;var a=i.anchorOffset,o=i.focusNode;i=i.focusOffset;try{r.nodeType,o.nodeType}catch{r=null;break a}var s=0,c=-1,l=-1,u=0,d=0,f=e,p=null;b:for(;;){for(var m;f!==r||a!==0&&f.nodeType!==3||(c=s+a),f!==o||i!==0&&f.nodeType!==3||(l=s+i),f.nodeType===3&&(s+=f.nodeValue.length),(m=f.firstChild)!==null;)p=f,f=m;for(;;){if(f===e)break b;if(p===r&&++u===a&&(c=s),p===o&&++d===i&&(l=s),(m=f.nextSibling)!==null)break;f=p,p=f.parentNode}f=m}r=c===-1||l===-1?null:{start:c,end:l}}else r=null}r||={start:0,end:0}}else r=null;for(cp={focusedElem:e,selectionRange:r},gh=!1,n=(n&335544064)===n,su=t,t=n?9270:1024;su!==null;){if(e=su,n&&(r=e.deletions,r!==null))for(a=0;a<r.length;a++)n&&Xl(r[a]);if(e.alternate===null&&e.flags&2)n&&Bl(e),pu(n);else{if(e.tag===22){if(r=e.alternate,e.memoizedState!==null){r!==null&&r.memoizedState===null&&n&&Xl(r),pu(n);continue}if(r!==null&&r.memoizedState!==null){n&&Bl(e),pu(n);continue}}r=e.child,(e.subtreeFlags&t)!==0&&r!==null?(r.return=e,su=r):(n&&Zl(e),pu(n))}}zl=null}function pu(e){for(;su!==null;){var t=su,n=e,r=t.alternate,a=t.flags;switch(t.tag){case 0:case 11:case 15:break;case 1:if(a&1024&&r!==null){n=void 0,a=r.memoizedProps,r=r.memoizedState;var o=t.stateNode;try{var s=bc(t.type,a);n=o.getSnapshotBeforeUpdate(s,r),o.__reactInternalSnapshotBeforeUpdate=n}catch(e){Z(t,t.return,e)}}break;case 3:if(a&1024){if(r=t.stateNode.containerInfo,n=r.nodeType,n===9)nm(r);else if(n===1)switch(r.nodeName){case`HEAD`:case`HTML`:case`BODY`:nm(r);break;default:r.textContent=``}}break;case 5:case 26:case 27:case 6:case 4:case 17:break;case 30:n&&r!==null&&(n=mi(r.memoizedProps,r.stateNode),a=t.memoizedProps,a=gi(a.default,a.update),a!==`none`&&Wl(r,n,a,r.memoizedState=[],!0));break;default:if(a&1024)throw Error(i(163))}if(r=t.sibling,r!==null){r.return=t.return,su=r;break}su=t.return}}function mu(e,t,n){var r=n.flags;switch(n.tag){case 0:case 11:case 15:Pu(e,n),r&4&&bl(5,n);break;case 1:if(Pu(e,n),r&4){if(e=n.stateNode,t===null)try{e.componentDidMount()}catch(e){Z(n,n.return,e)}else{var i=bc(n.type,t.memoizedProps);t=t.memoizedState;try{e.componentDidUpdate(i,t,e.__reactInternalSnapshotBeforeUpdate)}catch(e){Z(n,n.return,e)}}}r&64&&Sl(n),r&512&&wl(n,n.return);break;case 3:if(Pu(e,n),r&64&&(e=n.updateQueue,e!==null)){if(t=null,n.child!==null)switch(n.child.tag){case 27:case 5:t=n.child.stateNode;break;case 1:t=n.child.stateNode}try{So(e,t)}catch(e){Z(n,n.return,e)}}break;case 27:t===null&&r&4&&Ll(n);case 26:case 5:Pu(e,n),t===null&&r&4&&jl(n),r&512&&wl(n,n.return);break;case 12:Pu(e,n);break;case 31:Pu(e,n),r&4&&Cu(e,n);break;case 13:Pu(e,n),r&4&&wu(e,n),r&64&&(e=n.memoizedState,e!==null&&(e=e.dehydrated,e!==null&&(n=_f.bind(null,n),cm(e,n))));break;case 22:if(r=n.memoizedState!==null||ru,!r){var a=t!==null&&t.memoizedState!==null||K;t=ru,i=K,ru=r,(K=a)&&!i?(r=2,n.subtreeFlags&8772&&(r|=1),Iu(e,n,r)):Pu(e,n),ru=t,K=i}break;case 30:Pu(e,n),r&512&&wl(n,n.return);break;case 7:r&512&&wl(n,n.return);default:Pu(e,n)}}function hu(e,t){for(e=e.child;e!==null;)gu(e,t),e=e.sibling}function gu(e,t){switch(e.tag){case 5:case 26:try{var n=e.stateNode;if(t){var r=n.style;typeof r.setProperty==`function`?r.setProperty(`display`,`none`,`important`):r.display=`none`}else{var i=e.stateNode,a=e.memoizedProps.style,o=a!=null&&a.hasOwnProperty(`display`)?a.display:null;i.style.display=o==null||typeof o==`boolean`?``:(``+o).trim()}}catch(t){Z(e,e.return,t)}_u(e,t);break;case 6:try{e.stateNode.nodeValue=t?``:e.memoizedProps,V=!0}catch(t){Z(e,e.return,t)}break;case 18:try{var s=e.stateNode;t?wp(s,!0):wp(e.stateNode,!1)}catch(t){Z(e,e.return,t)}break;case 22:case 23:e.memoizedState===null&&hu(e,t);break;default:hu(e,t)}}function _u(e,t){if(e.subtreeFlags&67108864)for(e=e.child;e!==null;){a:{var n=e,r=t;switch(n.tag){case 4:gu(n,r);break a;case 22:n.memoizedState===null&&_u(n,r);break a;default:_u(n,r)}}e=e.sibling}}function vu(e){var t=e.alternate;t!==null&&(e.alternate=null,vu(t)),e.child=null,e.deletions=null,e.sibling=null,e.tag===5&&(t=e.stateNode,t!==null&&kt(t)),e.stateNode=null,e.return=null,e.dependencies=null,e.memoizedProps=null,e.memoizedState=null,e.pendingProps=null,e.stateNode=null,e.updateQueue=null}var yu=null,bu=!1;function xu(e,t,n){for(n=n.child;n!==null;)Su(e,t,n),n=n.sibling}function Su(e,t,n){if(Je&&typeof Je.onCommitFiberUnmount==`function`)try{Je.onCommitFiberUnmount(qe,n)}catch{}switch(n.tag){case 26:K||Tl(n,t),xu(e,t,n),n.memoizedState?n.memoizedState.count--:n.stateNode&&!K&&(n=n.stateNode,n.parentNode.removeChild(n));break;case 27:K||Tl(n,t),Ol(n);var r=yu,i=bu;Sp(n.type)&&(yu=n.stateNode,bu=!1),xu(e,t,n),gm(n.stateNode,n.type,n.memoizedProps),yu=r,bu=i;break;case 5:K||Tl(n,t),Ol(n);case 6:if(n.tag===6&&Ol(n),r=yu,i=bu,yu=null,xu(e,t,n),yu=r,bu=i,yu!==null){if(bu)try{(yu.nodeType===9?yu.body:yu.nodeName===`HTML`?yu.ownerDocument.body:yu).removeChild(n.stateNode),V=!0}catch(e){Z(n,t,e)}else try{yu.removeChild(n.stateNode),V=!0}catch(e){Z(n,t,e)}}break;case 18:yu!==null&&(bu?(e=yu,Cp(e.nodeType===9?e.body:e.nodeName===`HTML`?e.ownerDocument.body:e,n.stateNode),Hh(e)):Cp(yu,n.stateNode));break;case 4:r=yu,i=bu,yu=n.stateNode.containerInfo,bu=!0,xu(e,t,n),yu=r,bu=i;break;case 0:case 11:case 14:case 15:xl(2,n,t),K||xl(4,n,t),xu(e,t,n);break;case 1:K||(Tl(n,t),r=n.stateNode,typeof r.componentWillUnmount==`function`&&Cl(n,t,r)),xu(e,t,n);break;case 21:xu(e,t,n);break;case 22:K=(r=K)||n.memoizedState!==null,xu(e,t,n),K=r;break;case 30:Tl(n,t),xu(e,t,n);break;case 7:K||Tl(n,t),xu(e,t,n);break;default:xu(e,t,n)}}function Cu(e,t){if(t.memoizedState===null&&(e=t.alternate,e!==null&&(e=e.memoizedState,e!==null))){e=e.dehydrated;try{Hh(e)}catch(e){Z(t,t.return,e)}}}function wu(e,t){if(t.memoizedState===null&&(e=t.alternate,e!==null&&(e=e.memoizedState,e!==null&&(e=e.dehydrated,e!==null))))try{Hh(e)}catch(e){Z(t,t.return,e)}}function Tu(e){switch(e.tag){case 31:case 13:case 19:var t=e.stateNode;return t===null&&(t=e.stateNode=new ou),t;case 22:return e=e.stateNode,t=e._retryCache,t===null&&(t=e._retryCache=new ou),t;default:throw Error(i(435,e.tag))}}function Eu(e,t){var n=Tu(e);t.forEach(function(t){if(!n.has(t)){n.add(t);var r=vf.bind(null,e,t);t.then(r,r)}})}function Du(e,t,n){var r=t.deletions;if(r!==null)for(var a=0;a<r.length;a++){var o=r[a],s=e,c=t,l=c;a:for(;l!==null;){switch(l.tag){case 27:if(Sp(l.type)){yu=l.stateNode,bu=!1;break a}break;case 5:yu=l.stateNode,bu=!1;break a;case 3:case 4:yu=l.stateNode.containerInfo,bu=!0;break a}l=l.return}if(yu===null)throw Error(i(160));Su(s,c,o),yu=null,bu=!1,s=o.alternate,s!==null&&(s.return=null),o.return=null}if(t.subtreeFlags&13886)for(t=t.child;t!==null;)ku(t,e,n),t=t.sibling}var Ou=null;function ku(e,t,n){var r=e.alternate,a=e.flags;switch(e.tag){case 0:case 11:case 14:case 15:if(a&4&&(r=e.updateQueue,r=r===null?null:r.events,r!==null))for(var o=0;o<r.length;o++){var s=r[o];s.ref.impl=s.nextImpl}Du(t,e,n),Au(e),a&4&&(xl(3,e,e.return),bl(3,e),xl(5,e,e.return));break;case 1:Du(t,e,n),Au(e),a&512&&(K||r===null||Tl(r,r.return)),a&64&&ru&&(e=e.updateQueue,e!==null&&(t=e.callbacks,t!==null&&(n=e.shared.hiddenCallbacks,e.shared.hiddenCallbacks=n===null?t:n.concat(t))));break;case 26:if(o=Ou,Du(t,e,n),Au(e),a&512&&(K||r===null||Tl(r,r.return)),a&4){if(a=r===null?null:r.memoizedState,n=e.memoizedState,r===null){if(n===null){if(e.stateNode===null){if(ru)e.stateNode=fp(e.type,e.memoizedProps,t.containerInfo,e);else{a:{t=e.type,n=e.memoizedProps,a=o.ownerDocument||o;b:switch(t){case`title`:r=a.getElementsByTagName(`title`)[0],(!r||r[Dt]||r[bt]||r.namespaceURI===`http://www.w3.org/2000/svg`||r.hasAttribute(`itemprop`))&&(r=a.createElement(t),a.head.insertBefore(r,a.querySelector(`head > title`))),np(r,t,n),r[bt]=e,Pt(r),t=r;break a;case`link`:if(o=Gm(`link`,`href`,a).get(t+(n.href||``))){for(s=0;s<o.length;s++)if(r=o[s],r.getAttribute(`href`)===(n.href==null||n.href===``?null:n.href)&&r.getAttribute(`rel`)===(n.rel==null?null:n.rel)&&r.getAttribute(`title`)===(n.title==null?null:n.title)&&r.getAttribute(`crossorigin`)===(n.crossOrigin==null?null:n.crossOrigin)){o.splice(s,1);break b}}r=a.createElement(t),np(r,t,n),a.head.appendChild(r);break;case`meta`:if(o=Gm(`meta`,`content`,a).get(t+(n.content||``))){for(s=0;s<o.length;s++)if(r=o[s],r.getAttribute(`content`)===(n.content==null?null:``+n.content)&&r.getAttribute(`name`)===(n.name==null?null:n.name)&&r.getAttribute(`property`)===(n.property==null?null:n.property)&&r.getAttribute(`http-equiv`)===(n.httpEquiv==null?null:n.httpEquiv)&&r.getAttribute(`charset`)===(n.charSet==null?null:n.charSet)){o.splice(s,1);break b}}r=a.createElement(t),np(r,t,n),a.head.appendChild(r);break;default:throw Error(i(468,t))}r[bt]=e,Pt(r),t=r}e.stateNode=t}}else ru||Km(o,e.type,e.stateNode)}else e.stateNode=Bm(o,n,e.memoizedProps)}else a===n?n===null&&e.stateNode!==null&&Ml(e,e.memoizedProps,r.memoizedProps):(a===null?(t=r.stateNode,t===null||K||t.parentNode.removeChild(t)):a.count--,n===null?ru||Km(o,e.type,e.stateNode):Bm(o,n,e.memoizedProps))}break;case 27:Du(t,e,n),Au(e),a&512&&(K||r===null||Tl(r,r.return)),r!==null&&a&4&&Ml(e,e.memoizedProps,r.memoizedProps);break;case 5:if(o=iu,iu=!1,Du(t,e,n),iu=o,Au(e),a&512&&(K||r===null||Tl(r,r.return)),e.flags&32){t=e.stateNode;try{cn(t,``),V=!0}catch(t){Z(e,e.return,t)}}a&4&&e.stateNode!=null&&(t=e.memoizedProps,Ml(e,t,r===null?t:r.memoizedProps)),a&1024&&(au=!0);break;case 6:if(Du(t,e,n),Au(e),a&4){if(e.stateNode===null)throw Error(i(162));t=e.memoizedProps,n=e.stateNode;try{n.nodeValue=t,V=!0}catch(t){Z(e,e.return,t)}}break;case 3:if(V=!1,Wm=null,o=Ou,Ou=bm(t.containerInfo),Du(t,e,n),Ou=o,Au(e),a&4&&r!==null&&r.memoizedState.isDehydrated)try{Hh(t.containerInfo)}catch(t){Z(e,e.return,t)}au&&(au=!1,ju(e)),V=!1;break;case 4:a=iu,iu=ru,r=Wt(),o=Ou,Ou=bm(e.stateNode.containerInfo),Du(t,e,n),Au(e),Ou=o,V&&lu&&(uu=!0),V=r,iu=a;break;case 12:Du(t,e,n),Au(e);break;case 31:Du(t,e,n),Au(e),a&4&&(t=e.updateQueue,t!==null&&(e.updateQueue=null,Eu(e,t)));break;case 13:Du(t,e,n),Au(e),e.child.flags&8192&&e.memoizedState!==null!=(r!==null&&r.memoizedState!==null)&&(md=Re()),a&4&&(t=e.updateQueue,t!==null&&(e.updateQueue=null,Eu(e,t)));break;case 22:o=e.memoizedState!==null,s=r!==null&&r.memoizedState!==null;var c=ru,l=K,u=iu;ru=c||o,iu=u||o,K=l||s,Du(t,e,n),K=l,iu=u,ru=c,Au(e),a&8192&&(t=e.stateNode,t._visibility=o?t._visibility&-2:t._visibility|1,!o||r===null||s||ru||K||(t=s||K,n=ru,r=K,ru=o||ru,K=t,Fu(e,2),ru=n,K=r),!o&&iu||hu(e,o)),a&4&&(t=e.updateQueue,t!==null&&(n=t.retryQueue,n!==null&&(t.retryQueue=null,Eu(e,n))));break;case 19:Du(t,e,n),Au(e),a&4&&(t=e.updateQueue,t!==null&&(e.updateQueue=null,Eu(e,t)));break;case 30:a&512&&(K||r===null||Tl(r,r.return)),a=Wt(),o=lu,s=(n&335544064)===n,c=e.memoizedProps,lu=s&&gi(c.default,c.update)!==`none`,Du(t,e,n),Au(e),s&&r!==null&&V&&(e.flags|=4),lu=o,V=a;break;case 21:break;case 7:a&512&&(K||r===null||Tl(r,r.return)),r&&r.stateNode!==null&&(r.stateNode._fragmentFiber=e);default:Du(t,e,n),Au(e)}}function Au(e){var t=e.flags;if(t&2){try{for(var n,r=e.return;r!==null;){if(Nl(r)){n=r;break}r=r.return}r=null;for(var a=e.return;a!==null;){if(Al(a)){var o=a.stateNode;r===null?r=[o]:r.push(o)}if(kl(a))break;a=a.return}var s=r;if(n==null)throw Error(i(160));switch(n.tag){case 27:var c=n.stateNode;Il(e,Pl(e),c,s);break;case 5:var l=n.stateNode;n.flags&32&&(cn(l,``),n.flags&=-33),Il(e,Pl(e),l,s);break;case 3:case 4:var u=n.stateNode.containerInfo;Fl(e,Pl(e),u,s);break;default:throw Error(i(161))}}catch(t){Z(e,e.return,t)}e.flags&=-3}t&4096&&(e.flags&=-4097)}function ju(e){if(e.subtreeFlags&1024)for(e=e.child;e!==null;){var t=e;ju(t),t.tag===5&&t.flags&1024&&(t=t.stateNode,gh=!0,t.reset(),gh=!1),e=e.sibling}}function Mu(e,t){if(t.subtreeFlags&9270)for(t=t.child;t!==null;)Nu(t,e),t=t.sibling;else nu(t,!1)}function Nu(e,t){var n=e.alternate;if(n===null)Jl(e,!1);else switch(e.tag){case 3:if(du=cu=!1,Hl(),Mu(t,e),!cu&&!uu){if(e=Vl,e!==null)for(var r=0;r<e.length;r+=3){n=e[r];var i=e[r+1];Ep(n,e[r+2]),n=n.ownerDocument.documentElement,n!==null&&n.animate({opacity:[0,0],pointerEvents:[`none`,`none`]},{duration:0,fill:`forwards`,pseudoElement:`::view-transition-group(`+i+`)`})}e=t.containerInfo,e=e.nodeType===9?e.documentElement:e.ownerDocument.documentElement,e!==null&&e.style.viewTransitionName===``&&(e.style.viewTransitionName=`none`,e.animate({opacity:[0,0],pointerEvents:[`none`,`none`]},{duration:0,fill:`forwards`,pseudoElement:`::view-transition-group(root)`}),e.animate({width:[0,0],height:[0,0]},{duration:0,fill:`forwards`,pseudoElement:`::view-transition`})),du=!0}Vl=null;break;case 5:Mu(t,e);break;case 4:r=cu,cu=!1,Mu(t,e),cu&&(uu=!0),cu=r;break;case 22:e.memoizedState===null&&(n.memoizedState===null?Mu(t,e):Jl(e,!1));break;case 30:r=cu,i=Hl(),cu=!1,Mu(t,e),cu&&(e.flags|=4);var a=e.memoizedProps,o=e.stateNode;t=mi(a,o),o=mi(n.memoizedProps,o);var s=gi(a.default,a.update);s===`none`?t=!1:(a=n.memoizedState,n.memoizedState=null,n=e.child,Ul=0,t=tu(e,n,t,o,s,a,!0),Ul!==(a===null?0:a.length)&&(e.flags|=32)),e.flags&4&&t?(Nd(e,e.memoizedProps.onUpdate),Vl=i):i!==null&&(i.push.apply(i,Vl),Vl=i),cu=e.flags&32?!0:r;break;default:Mu(t,e)}}function Pu(e,t){if(t.subtreeFlags&8772)for(t=t.child;t!==null;)mu(e,t.alternate,t),t=t.sibling}function Fu(e,t){for(e=e.child;e!==null;){var n=e,r=t;switch(n.tag){case 0:case 11:case 14:case 15:xl(4,n,n.return),Fu(n,r);break;case 1:Tl(n,n.return);var i=n.stateNode;typeof i.componentWillUnmount==`function`&&Cl(n,n.return,i),Fu(n,r);break;case 27:r&2&&gm(n.stateNode,n.type,n.memoizedProps);case 5:Tl(n,n.return),n.tag!==5&&n.tag!==27||Ol(n),Fu(n,r);break;case 6:Ol(n);break;case 26:Tl(n,n.return),i=n.stateNode,n.memoizedState!==null||i===null||K||i.parentNode.removeChild(i),Fu(n,r);break;case 22:n.memoizedState===null&&Fu(n,r);break;case 30:Tl(n,n.return),Fu(n,r);break;case 7:Tl(n,n.return);default:Fu(n,r)}e=e.sibling}}function Iu(e,t,n){for(n=t.subtreeFlags&8772?n:n&-2,t=t.child;t!==null;){var r=t.alternate,i=e,a=t,o=a.flags,s=!!(n&1);switch(a.tag){case 0:case 11:case 15:Iu(i,a,n),bl(4,a);break;case 1:if(Iu(i,a,n),r=a,i=r.stateNode,typeof i.componentDidMount==`function`)try{i.componentDidMount()}catch(e){Z(r,r.return,e)}if(r=a,i=r.updateQueue,i!==null){var c=r.stateNode;try{var l=i.shared.hiddenCallbacks;if(l!==null)for(i.shared.hiddenCallbacks=null,i=0;i<l.length;i++)xo(l[i],c)}catch(e){Z(r,r.return,e)}}s&&o&64&&Sl(a),wl(a,a.return);break;case 27:n&2&&Ll(a);case 5:a.tag!==5&&a.tag!==27||Dl(a),Iu(i,a,n),s&&r===null&&o&4&&jl(a),wl(a,a.return);break;case 6:Dl(a);break;case 26:c=a.stateNode,a.memoizedState!==null||c===null||ru||Km(bm(c.ownerDocument),a.type,c),Iu(i,a,n),s&&r===null&&o&4&&jl(a),wl(a,a.return);break;case 12:Iu(i,a,n);break;case 31:Iu(i,a,n),s&&o&4&&Cu(i,a);break;case 13:Iu(i,a,n),s&&o&4&&wu(i,a);break;case 22:a.memoizedState===null&&Iu(i,a,n),wl(a,a.return);break;case 30:Iu(i,a,n),wl(a,a.return);break;case 7:wl(a,a.return);default:Iu(i,a,n)}t=t.sibling}}function Lu(e,t){var n=null;e!==null&&e.memoizedState!==null&&e.memoizedState.cachePool!==null&&(n=e.memoizedState.cachePool.pool),e=null,t.memoizedState!==null&&t.memoizedState.cachePool!==null&&(e=t.memoizedState.cachePool.pool),e!==n&&(e!=null&&e.refCount++,n!=null&&Aa(n))}function Ru(e,t){e=null,t.alternate!==null&&(e=t.alternate.memoizedState.cache),t=t.memoizedState.cache,t!==e&&(t.refCount++,e!=null&&Aa(e))}function zu(e,t,n,r){var i=(n&335544064)===n;if(t.subtreeFlags&(i?10262:10256))for(t=t.child;t!==null;)Bu(e,t,n,r),t=t.sibling;else i&&eu(t)}function Bu(e,t,n,r){var i=(n&335544064)===n;i&&t.alternate===null&&t.return!==null&&t.return.alternate!==null&&$l(t);var a=t.flags;switch(t.tag){case 0:case 11:case 15:zu(e,t,n,r),a&2048&&bl(9,t);break;case 1:zu(e,t,n,r);break;case 3:zu(e,t,n,r),i&&du&&(e=e.containerInfo,e=e.nodeType===9?e.body:e.nodeName===`HTML`?e.ownerDocument.body:e,e.style.viewTransitionName===`root`&&(e.style.viewTransitionName=``),e=e.ownerDocument.documentElement,e!==null&&e.style.viewTransitionName===`none`&&(e.style.viewTransitionName=``)),a&2048&&(a=null,t.alternate!==null&&(a=t.alternate.memoizedState.cache),t=t.memoizedState.cache,t!==a&&(t.refCount++,a!=null&&Aa(a)));break;case 12:if(a&2048){zu(e,t,n,r),a=t.stateNode;try{var o=t.memoizedProps,s=o.id,c=o.onPostCommit;typeof c==`function`&&c(s,t.alternate===null?`mount`:`update`,a.passiveEffectDuration,-0)}catch(e){Z(t,t.return,e)}}else zu(e,t,n,r);break;case 31:zu(e,t,n,r);break;case 13:zu(e,t,n,r);break;case 23:break;case 22:o=t.stateNode,s=t.alternate,t.memoizedState===null?(i&&s!==null&&s.memoizedState!==null&&$l(t),o._visibility&2?zu(e,t,n,r):(o._visibility|=2,Vu(e,t,n,r,!!(t.subtreeFlags&10256)||!1))):(i&&s!==null&&s.memoizedState===null&&$l(s),o._visibility&2?zu(e,t,n,r):Hu(e,t)),a&2048&&Lu(s,t);break;case 24:zu(e,t,n,r),a&2048&&Ru(t.alternate,t);break;case 30:i&&(a=t.alternate,a!==null&&(Kl(a.child,!0),Kl(t.child,!0))),zu(e,t,n,r);break;default:zu(e,t,n,r)}}function Vu(e,t,n,r,i){for(i&&=!!(t.subtreeFlags&10256)||!1,t=t.child;t!==null;){var a=e,o=t,s=n,c=r,l=o.flags;switch(o.tag){case 0:case 11:case 15:Vu(a,o,s,c,i),bl(8,o);break;case 23:break;case 22:var u=o.stateNode;o.memoizedState===null?(u._visibility|=2,Vu(a,o,s,c,i)):u._visibility&2?Vu(a,o,s,c,i):Hu(a,o),i&&l&2048&&Lu(o.alternate,o);break;case 24:Vu(a,o,s,c,i),i&&l&2048&&Ru(o.alternate,o);break;default:Vu(a,o,s,c,i)}t=t.sibling}}function Hu(e,t){if(t.subtreeFlags&10256)for(t=t.child;t!==null;){var n=e,r=t,i=r.flags;switch(r.tag){case 22:Hu(n,r),i&2048&&Lu(r.alternate,r);break;case 24:Hu(n,r),i&2048&&Ru(r.alternate,r);break;default:Hu(n,r)}t=t.sibling}}var Uu=8192;function Wu(e,t,n){if(e.subtreeFlags&Uu)for(e=e.child;e!==null;)Gu(e,t,n),e=e.sibling}function Gu(e,t,n){switch(e.tag){case 26:Wu(e,t,n),e.flags&Uu&&(e.memoizedState===null?(e=e.stateNode,(t&335544128)===t&&Zm(n,e)):Qm(n,Ou,e.memoizedState,e.memoizedProps));break;case 5:Wu(e,t,n),e.flags&Uu&&(e=e.stateNode,(t&335544128)===t&&Zm(n,e));break;case 3:case 4:var r=Ou;Ou=bm(e.stateNode.containerInfo),Wu(e,t,n),Ou=r;break;case 22:e.memoizedState===null&&(r=e.alternate,r!==null&&r.memoizedState!==null?(r=Uu,Uu=16777216,Wu(e,t,n),Uu=r):Wu(e,t,n));break;case 30:if((e.flags&Uu)!==0&&(r=e.memoizedProps.name,r!=null&&r!==`auto`)){var i=e.stateNode;i.paired=null,zl===null&&(zl=new Map),zl.set(r,i)}Wu(e,t,n);break;default:Wu(e,t,n)}}function Ku(e){var t=e.alternate;if(t!==null&&(e=t.child,e!==null)){t.child=null;do t=e.sibling,e.sibling=null,e=t;while(e!==null)}}function qu(e){var t=e.deletions;if(e.flags&16){if(t!==null)for(var n=0;n<t.length;n++){var r=t[n];su=r,Xu(r,e)}Ku(e)}if(e.subtreeFlags&10256)for(e=e.child;e!==null;)Ju(e),e=e.sibling}function Ju(e){switch(e.tag){case 0:case 11:case 15:qu(e),e.flags&2048&&xl(9,e,e.return);break;case 3:qu(e);break;case 12:qu(e);break;case 22:var t=e.stateNode;e.memoizedState!==null&&t._visibility&2&&(e.return===null||e.return.tag!==13)?(t._visibility&=-3,Yu(e)):qu(e);break;default:qu(e)}}function Yu(e){var t=e.deletions;if(e.flags&16){if(t!==null)for(var n=0;n<t.length;n++){var r=t[n];su=r,Xu(r,e)}Ku(e)}for(e=e.child;e!==null;){switch(t=e,t.tag){case 0:case 11:case 15:xl(8,t,t.return),Yu(t);break;case 22:n=t.stateNode,n._visibility&2&&(n._visibility&=-3,Yu(t));break;default:Yu(t)}e=e.sibling}}function Xu(e,t){for(;su!==null;){var n=su;switch(n.tag){case 0:case 11:case 15:xl(8,n,t);break;case 23:case 22:if(n.memoizedState!==null&&n.memoizedState.cachePool!==null){var r=n.memoizedState.cachePool.pool;r!=null&&r.refCount++}break;case 24:Aa(n.memoizedState.cache)}if(r=n.child,r!==null)r.return=n,su=r;else a:for(n=e;su!==null;){r=su;var i=r.sibling,a=r.return;if(vu(r),r===n){su=null;break a}if(i!==null){i.return=a,su=i;break a}su=a}}}var Zu={getCacheForType:function(e){var t=Sa(Oa),n=t.data.get(e);return n===void 0&&(n=e(),t.data.set(e,n)),n},cacheSignal:function(){return Sa(Oa).controller.signal}},Qu=typeof WeakMap==`function`?WeakMap:Map,q=0,$u=null,J=null,Y=0,X=0,ed=null,td=!1,nd=!1,rd=!1,id=0,ad=0,od=0,sd=0,cd=0,ld=0,ud=0,dd=null,fd=null,pd=!1,md=0,hd=0,gd=1/0,_d=null,vd=null,yd=0,bd=null,xd=null,Sd=0,Cd=0,wd=null,Td=null,Ed=null,Dd=null,Od=null,kd=0,Ad=null;function jd(){return q&2&&Y!==0?Y&-Y:R.T===null?_t():Pf()}function Md(){if(ld===0){if(!(Y&536870912)||U){var e=tt;tt<<=1,!(tt&3932160)&&(tt=262144),ld=e}else ld=536870912}return e=Oo.current,e!==null&&(e.flags|=32),ld}function Nd(e,t){if(t!=null){var n=e.stateNode,r=n.ref;r===null&&(r=n.ref=Pp(mi(e.memoizedProps,n))),Dd===null&&(Dd=[]),Dd.push(t.bind(null,r))}}function Pd(e,t,n){(e===$u&&(X===2||X===9)||e.cancelPendingCommit!==null)&&(Vd(e,0),Rd(e,Y,ld,!1)),ut(e,n),q&2&&e===$u||(e===$u&&(!(q&2)&&(sd|=n),ad===4&&Rd(e,Y,ld,!1)),Ef(e))}function Fd(e,t,n){if(q&6)throw Error(i(327));var r=!n&&!(t&127)&&(t&e.expiredLanes)===0||at(e,t),a=r?Yd(e,t):qd(e,t,!0),o=r;do{if(a===0){nd&&!r&&Rd(e,t,0,!1);break}if(n=e.current.alternate,o&&!Ld(n))a=qd(e,t,!1),o=!1;else{if(a===2){if(o=t,e.errorRecoveryDisabledLanes&o)var s=0;else s=e.pendingLanes&-536870913,s=s===0?s&536870912?536870912:0:s;if(s!==0){t=s;a:{var c=e;a=dd;var l=c.current.memoizedState.isDehydrated;if(l&&(Vd(c,s).flags|=256),s=qd(c,s,!1),s!==2&&s!==6){if(rd&&!l){c.errorRecoveryDisabledLanes|=o,sd|=o,a=4;break a}o=fd,fd=a,o!==null&&(fd===null?fd=o:fd.push.apply(fd,o))}a=s}if(o=!1,a!==2)continue}}if(a===1){Vd(e,0),Rd(e,t,0,!0);break}a:{switch(r=e,o=a,o){case 0:case 1:throw Error(i(345));case 4:if((t&4194048)!==t&&(t&62914560)!==t)break;case 6:Rd(r,t,ld,!td);break a;case 2:fd=null;break;case 3:case 5:break;default:throw Error(i(329))}if((t&62914560)===t&&(a=md+300-Re(),10<a)){if(Rd(r,t,ld,!td),it(r,0,!0)!==0)break a;Sd=t,r.timeoutHandle=gp(Id.bind(null,r,n,fd,_d,pd,t,ld,sd,ud,td,o,`Throttled`,-0,0),a);break a}Id(r,n,fd,_d,pd,t,ld,sd,ud,td,o,null,-0,0)}break}}while(1);Ef(e)}function Id(e,t,n,r,i,a,o,s,c,l,u,d,f,p){e.timeoutHandle=-1;var m=t.subtreeFlags,h=(a&335544064)===a;d=null,(h||m&8192||(m&16785408)==16785408)&&(d={stylesheets:null,count:0,imgCount:0,imgBytes:0,suspenseyImages:[],waitingForImages:!0,waitingForViewTransition:!1,unsuspend:gn},zl=null,Gu(t,a,d),h&&(m=d,h=e.containerInfo,h=(h.nodeType===9?h:h.ownerDocument).__reactViewTransition,h!=null&&(m.count++,m.waitingForViewTransition=!0,m=nh.bind(m),h.finished.then(m,m))),m=(a&62914560)===a?md-Re():(a&4194048)===a?hd-Re():0,m=eh(d,m),m!==null)?(Sd=a,e.cancelPendingCommit=m(nf.bind(null,e,t,a,n,r,i,o,s,c,l,u,d,null,f,p)),Rd(e,a,o,!l)):nf(e,t,a,n,r,i,o,s,c,l,u,d)}function Ld(e){for(var t=e;;){var n=t.tag;if((n===0||n===11||n===15)&&t.flags&16384&&(n=t.updateQueue,n!==null&&(n=n.stores,n!==null)))for(var r=0;r<n.length;r++){var i=n[r],a=i.getSnapshot;i=i.value;try{if(!Rr(a(),i))return!1}catch{return!1}}if(n=t.child,t.subtreeFlags&16384&&n!==null)n.return=t,t=n;else{if(t===e)break;for(;t.sibling===null;){if(t.return===null||t.return===e)return!0;t=t.return}t.sibling.return=t.return,t=t.sibling}}return!0}function Rd(e,t,n,r){t=ot(e,t),t&=~cd,t&=~sd,e.suspendedLanes|=t,e.pingedLanes&=~t,r&&(e.warmLanes|=t),r=e.expirationTimes;for(var i=t;0<i;){var a=31-Xe(i),o=1<<a;r[a]=-1,i&=~o}n!==0&&ft(e,n,t)}function zd(){return q&6?!0:(Df(0,!1),!1)}function Bd(){if(J!==null){if(X===0)var e=J.return;else e=J,ma=pa=null,ns(e),no=null,ro=0,e=J;for(;e!==null;)yl(e.alternate,e),e=e.return;J=null}}function Vd(e,t){var n=e.timeoutHandle;return n!==-1&&(e.timeoutHandle=-1,_p(n)),n=e.cancelPendingCommit,n!==null&&(e.cancelPendingCommit=null,n()),Sd=0,Bd(),$u=e,J=n=ji(e.current,null),Y=t,X=0,ed=null,td=!1,nd=at(e,t),rd=!1,ud=ld=cd=sd=od=ad=0,fd=dd=null,pd=!1,id=ot(e,t),xi(),n}function Hd(e,t){W=null,R.H=fc,t===Ka||t===Ja?(t=eo(),X=3):t===qa?(t=eo(),X=4):X=t===Ac?8:typeof t==`object`&&t&&typeof t.then==`function`?6:1,ed=t,J===null&&(ad=1,wc(e,zi(t,e.current)))}function Ud(){var e=Oo.current;return e===null?!0:(Y&4194048)===Y?ko===null:(Y&62914560)===Y||Y&536870912?e===ko:!1}function Wd(){var e=R.H;return R.H=fc,e===null?fc:e}function Gd(){var e=R.A;return R.A=Zu,e}function Kd(){ad=4,td||(Y&4194048)!==Y&&Oo.current!==null||(nd=!0),!(od&134217727)&&!(sd&134217727)||$u===null||Rd($u,Y,ld,!1)}function qd(e,t,n){var r=q;q|=2;var i=Wd(),a=Gd();($u!==e||Y!==t)&&(_d=null,Vd(e,t)),t=!1;var o=ad;a:do try{if(X!==0&&J!==null){var s=J,c=ed;switch(X){case 8:Bd(),o=6;break a;case 3:case 2:case 9:case 6:Oo.current===null&&(t=!0);var l=X;if(X=0,ed=null,$d(e,s,c,l),n&&nd){o=0;break a}break;default:l=X,X=0,ed=null,$d(e,s,c,l)}}Jd(),o=ad;break}catch(t){Hd(e,t)}while(1);return t&&e.shellSuspendCounter++,ma=pa=null,q=r,R.H=i,R.A=a,J===null&&($u=null,Y=0,xi()),o}function Jd(){for(;J!==null;)Zd(J)}function Yd(e,t){var n=q;q|=2;var r=Wd(),a=Gd();$u!==e||Y!==t?(_d=null,gd=Re()+500,Vd(e,t)):nd=at(e,t);a:do try{if(X!==0&&J!==null){t=J;var o=ed;b:switch(X){case 1:X=0,ed=null,$d(e,t,o,1);break;case 2:case 9:if(Xa(o)){X=0,ed=null,Qd(t);break}t=function(){X!==2&&X!==9||$u!==e||(X=7),Ef(e)},o.then(t,t);break a;case 3:X=7;break a;case 4:X=5;break a;case 7:Xa(o)?(X=0,ed=null,Qd(t)):(X=0,ed=null,$d(e,t,o,7));break;case 5:var s=null;switch(J.tag){case 26:s=J.memoizedState;case 5:case 27:var c=J;if(s?Ym(s):c.stateNode.complete){X=0,ed=null;var l=c.sibling;if(l!==null)J=l;else{var u=c.return;u===null?J=null:(J=u,ef(u))}break b}}X=0,ed=null,$d(e,t,o,5);break;case 6:X=0,ed=null,$d(e,t,o,6);break;case 8:Bd(),ad=6;break a;default:throw Error(i(462))}}Xd();break}catch(t){Hd(e,t)}while(1);return ma=pa=null,R.H=r,R.A=a,q=n,J===null?($u=null,Y=0,xi(),ad):0}function Xd(){for(;J!==null&&!Ie();)Zd(J)}function Zd(e){var t=ul(e.alternate,e,id);e.memoizedProps=e.pendingProps,t===null?ef(e):J=t}function Qd(e){var t=e,n=t.alternate;switch(t.tag){case 15:case 0:t=Wc(n,t,t.pendingProps,t.type,void 0,Y);break;case 11:t=Wc(n,t,t.pendingProps,t.type.render,t.ref,Y);break;case 5:ns(t);var r=t;r===ea&&(U?(sa(r),r.tag===5&&r.stateNode!=null&&(ta=r.stateNode)):(sa(r),U=!0));default:yl(n,t),t=J=Mi(t,id),t=ul(n,t,id)}e.memoizedProps=e.pendingProps,t===null?ef(e):J=t}function $d(e,t,n,r){ma=pa=null,ns(t),no=null,ro=0;var i=t.return;try{if(kc(e,i,t,n,Y)){ad=1,wc(e,zi(n,e.current)),J=null;return}}catch(t){if(i!==null)throw J=i,t;ad=1,wc(e,zi(n,e.current)),J=null;return}t.flags&32768?(U||r===1?e=!0:nd||Y&536870912?e=!1:(td=e=!0,(r===2||r===9||r===3||r===6)&&(r=Oo.current,r!==null&&r.tag===13&&(r.flags|=16384))),tf(t,e)):ef(t)}function ef(e){var t=e;do{if(t.flags&32768){tf(t,td);return}e=t.return;var n=_l(t.alternate,t,id);if(n!==null){J=n;return}if(t=t.sibling,t!==null){J=t;return}J=t=e}while(t!==null);ad===0&&(ad=5)}function tf(e,t){do{var n=vl(e.alternate,e);if(n!==null){n.flags&=32767,J=n;return}if(n=e.return,n!==null&&(n.flags|=32768,n.subtreeFlags=0,n.deletions=null),!t&&(e=e.sibling,e!==null)){J=e;return}J=e=n}while(e!==null);ad=6,J=null}function nf(e,t,n,r,a,o,s,c,l,u,d,f){e.cancelPendingCommit=null;do df();while(yd!==0);if(q&6)throw Error(i(327));if(t!==null){if(t===e.current)throw Error(i(177));e===$u&&(J=$u=null,Y=0),xd=t,bd=e,Sd=n,wd=a,Td=r,rf(e,t,n,s,c,l,f)}}function rf(e,t,n,r,i,a,o){var s=t.lanes|t.childLanes;if(Cd=s,s|=bi,dt(e,n,s,r,i,a),Dd=null,(n&335544064)===n?(Od=Na(e),r=10262):(Od=null,r=10256),(t.subtreeFlags&r)!==0||(t.flags&r)!==0?(e.callbackNode=null,e.callbackPriority=0,yf(He,function(){return ff(),null})):(e.callbackNode=null,e.callbackPriority=0),Rl=!1,r=!!(t.flags&13878),t.subtreeFlags&13878||r){r=R.T,R.T=null,i=z.p,z.p=2,a=q,q|=4;try{fu(e,t,n)}finally{q=a,z.p=i,R.T=r}}yd=1,Rl?Ed=Mp(o,e.containerInfo,Od,sf,cf,of,lf,ff,af,null,null):(sf(),cf(),lf())}function af(e){if(yd!==0){var t=bd.onRecoverableError;t(e,{componentStack:null})}}function of(){yd===3&&(yd=0,Nu(xd,bd),yd=4)}function sf(){if(yd===1){yd=0;var e=bd,t=xd,n=Sd,r=!!(t.flags&13878);if(t.subtreeFlags&13878||r){r=R.T,R.T=null;var i=z.p;z.p=2;var a=q;q|=4;try{lu=uu=!1,ku(t,e,n),n=cp;var o=Wr(e.containerInfo),s=n.focusedElem,c=n.selectionRange;if(o!==s&&s&&s.ownerDocument&&Ur(s.ownerDocument.documentElement,s)){if(c!==null&&Gr(s)){var l=c.start,u=c.end;if(u===void 0&&(u=l),`selectionStart`in s)s.selectionStart=l,s.selectionEnd=Math.min(u,s.value.length);else{var d=s.ownerDocument||document,f=d&&d.defaultView||window;if(f.getSelection){var p=f.getSelection(),m=s.textContent.length,h=Math.min(c.start,m),g=c.end===void 0?h:Math.min(c.end,m);!p.extend&&h>g&&(o=g,g=h,h=o);var _=Hr(s,h),v=Hr(s,g);if(_&&v&&(p.rangeCount!==1||p.anchorNode!==_.node||p.anchorOffset!==_.offset||p.focusNode!==v.node||p.focusOffset!==v.offset)){var y=d.createRange();y.setStart(_.node,_.offset),p.removeAllRanges(),h>g?(p.addRange(y),p.extend(v.node,v.offset)):(y.setEnd(v.node,v.offset),p.addRange(y))}}}}for(d=[],p=s;p=p.parentNode;)p.nodeType===1&&d.push({element:p,left:p.scrollLeft,top:p.scrollTop});for(typeof s.focus==`function`&&s.focus(),s=0;s<d.length;s++){var b=d[s];b.element.scrollLeft=b.left,b.element.scrollTop=b.top}}gh=!!sp,cp=sp=null}finally{q=a,z.p=i,R.T=r}}e.current=t,yd=2}}function cf(){if(yd===2){yd=0;var e=bd,t=xd,n=!!(t.flags&8772);if(t.subtreeFlags&8772||n){n=R.T,R.T=null;var r=z.p;z.p=2;var i=q;q|=4;try{mu(e,t.alternate,t)}finally{q=i,z.p=r,R.T=n}}yd=3}}function lf(){if(yd===4||yd===3){yd=0;var e=Ed;Ed=null,Le();var t=bd,n=xd,r=Sd,i=Td,a=(r&335544064)===r?10262:10256;if((n.subtreeFlags&a)!==0||(n.flags&a)!==0?yd=5:(yd=0,xd=bd=null,uf(t,t.pendingLanes)),a=t.pendingLanes,a===0&&(vd=null),gt(r),n=n.stateNode,Je&&typeof Je.onCommitFiberRoot==`function`)try{Je.onCommitFiberRoot(qe,n,void 0,(n.current.flags&128)==128)}catch{}if(i!==null){n=R.T,a=z.p,z.p=2,R.T=null;try{for(var o=t.onRecoverableError,s=0;s<i.length;s++){var c=i[s];o(c.value,{componentStack:c.stack})}}finally{R.T=n,z.p=a}}if(i=Dd,o=Od,Od=null,i!==null&&(Dd=null,o===null&&(o=[]),e!==null))for(c=0;c<i.length;c++)n=(0,i[c])(o),n!==void 0&&e.finished.finally(n);Sd&3&&df(),Ef(t),a=t.pendingLanes,r&261930&&a&42?t===Ad?kd++:(kd=0,Ad=t):(kd=0,Ad=null),Df(0,!1)}}function uf(e,t){(e.pooledCacheLanes&=t)===0&&(t=e.pooledCache,t!=null&&(e.pooledCache=null,Aa(t)))}function df(){return Ed!==null&&(Ed.skipTransition(),Ed=null),sf(),cf(),lf(),ff()}function ff(){if(yd!==5)return!1;var e=bd,t=Cd;Cd=0;var n=gt(Sd),r=R.T,a=z.p;try{z.p=32>n?32:n,R.T=null,n=wd,wd=null;var o=bd,s=Sd;if(yd=0,xd=bd=null,Sd=0,q&6)throw Error(i(331));var c=q;if(q|=4,Ju(o.current),Bu(o,o.current,s,n),q=c,Df(0,!1),Je&&typeof Je.onPostCommitFiberRoot==`function`)try{Je.onPostCommitFiberRoot(qe,o)}catch{}return!0}finally{z.p=a,R.T=r,uf(e,t)}}function pf(e,t,n){t=zi(n,t),t=Ec(e.stateNode,t,2),e=ho(e,t,2),e!==null&&(ut(e,2),Ef(e))}function Z(e,t,n){if(e.tag===3)pf(e,e,n);else for(;t!==null;){if(t.tag===3){pf(t,e,n);break}if(t.tag===1){var r=t.stateNode;if(typeof t.type.getDerivedStateFromError==`function`||typeof r.componentDidCatch==`function`&&(vd===null||!vd.has(r))){e=zi(n,e),n=Dc(2),r=ho(t,n,2),r!==null&&(Oc(n,r,t,e),ut(r,2),Ef(r));break}}t=t.return}}function mf(e,t,n){var r=e.pingCache;if(r===null){r=e.pingCache=new Qu;var i=new Set;r.set(t,i)}else i=r.get(t),i===void 0&&(i=new Set,r.set(t,i));i.has(n)||(rd=!0,i.add(n),e=hf.bind(null,e,t,n),t.then(e,e))}function hf(e,t,n){var r=e.pingCache;r!==null&&r.delete(t),e.pingedLanes|=e.suspendedLanes&n,e.warmLanes&=~n,$u===e&&(Y&n)===n&&(ad===4||ad===3&&(Y&62914560)===Y&&300>Re()-md?q&2?cd|=n:Vd(e,0):cd|=n,ud===Y&&(ud=0)),Ef(e)}function gf(e,t){t===0&&(t=ct()),e=wi(e,t),e!==null&&(ut(e,t),Ef(e))}function _f(e){var t=e.memoizedState,n=0;t!==null&&(n=t.retryLane),gf(e,n)}function vf(e,t){var n=0;switch(e.tag){case 31:case 13:var r=e.stateNode,a=e.memoizedState;a!==null&&(n=a.retryLane);break;case 19:r=e.stateNode;break;case 22:r=e.stateNode._retryCache;break;default:throw Error(i(314))}r!==null&&r.delete(t),gf(e,n)}function yf(e,t){return Pe(e,t)}var bf=null,xf=null,Sf=!1,Cf=!1,wf=!1,Tf=0;function Ef(e){e!==xf&&e.next===null&&(xf===null?bf=xf=e:xf=xf.next=e),Cf=!0,Sf||(Sf=!0,Nf())}function Df(e,t){if(!wf&&Cf){wf=!0;do for(var n=!1,r=bf;r!==null;){if(!t){if(e!==0){var i=r.pendingLanes;if(i===0)var a=0;else{var o=r.suspendedLanes,s=r.pingedLanes;a=(1<<31-Xe(42|e)+1)-1,a&=i&~(o&~s),a=a&201326741?a&201326741|1:a?a|2:0}a!==0&&(n=!0,Mf(r,a))}else a=Y,a=it(r,r===$u?a:0,r.cancelPendingCommit!==null||r.timeoutHandle!==-1),!(a&3)||at(r,a)||(n=!0,Mf(r,a))}r=r.next}while(n);wf=!1}}function Of(){kf()}function kf(){Cf=Sf=!1;var e=0;Tf!==0&&hp()&&(e=Tf);for(var t=Re(),n=null,r=bf;r!==null;){var i=r.next,a=Af(r,t);a===0?(r.next=null,n===null?bf=i:n.next=i,i===null&&(xf=n)):(n=r,(e!==0||a&3)&&(Cf=!0)),r=i}yd!==0&&yd!==5||Df(e,!1),Tf!==0&&(Tf=0)}function Af(e,t){for(var n=e.suspendedLanes,r=e.pingedLanes,i=e.expirationTimes,a=e.pendingLanes&-62914561;0<a;){var o=31-Xe(a),s=1<<o,c=i[o];c===-1?((s&n)===0||(s&r)!==0)&&(i[o]=st(s,t)):c<=t&&(e.expiredLanes|=s),a&=~s}if(t=$u,n=Y,n=it(e,e===t?n:0,e.cancelPendingCommit!==null||e.timeoutHandle!==-1),r=e.callbackNode,n===0||e===t&&(X===2||X===9)||e.cancelPendingCommit!==null)return r!==null&&r!==null&&Fe(r),e.callbackNode=null,e.callbackPriority=0;if(!(n&3)||at(e,n)){if(t=n&-n,t===e.callbackPriority)return t;switch(r!==null&&Fe(r),gt(n)){case 2:case 8:n=Ve;break;case 32:n=He;break;case 268435456:n=We;break;default:n=He}return r=jf.bind(null,e),n=Pe(n,r),e.callbackPriority=t,e.callbackNode=n,t}return r!==null&&r!==null&&Fe(r),e.callbackPriority=2,e.callbackNode=null,2}function jf(e,t){if(yd!==0&&yd!==5)return e.callbackNode=null,e.callbackPriority=0,null;var n=e.callbackNode;if(df()&&e.callbackNode!==n)return null;var r=Y;return r=it(e,e===$u?r:0,e.cancelPendingCommit!==null||e.timeoutHandle!==-1),r===0?null:(Fd(e,r,t),Af(e,Re()),e.callbackNode!=null&&e.callbackNode===n?jf.bind(null,e):null)}function Mf(e,t){if(df())return null;Fd(e,t,!0)}function Nf(){bp(function(){q&6?Pe(Be,Of):kf()})}function Pf(){if(Tf===0){var e=Ia;e===0&&(e=et,et<<=1,!(et&261888)&&(et=256)),Tf=e}return Tf}function Ff(e){return e==null||typeof e==`symbol`||typeof e==`boolean`?null:typeof e==`function`?e:hn(e)}function If(e,t,n,r,i){if(t===`submit`&&n&&n.stateNode===i){var a=Ff((i[xt]||null).action),o=r.submitter;o&&(t=(t=o[xt]||null)?Ff(t.formAction):o.getAttribute(`formAction`),t!==null&&(a=t,o=null));var s=new H(`action`,`action`,null,r,i);e.push({event:s,listeners:[{instance:null,listener:function(){if(r.defaultPrevented){if(Tf!==0){var e=new FormData(i,o);Qs(n,{pending:!0,data:e,method:i.method,action:a},null,e)}}else typeof a==`function`&&(s.preventDefault(),e=new FormData(i,o),Qs(n,{pending:!0,data:e,method:i.method,action:a},a,e))},currentTarget:i}]})}}for(var Lf=0;Lf<di.length;Lf++){var Rf=di[Lf];fi(Rf.toLowerCase(),`on`+(Rf[0].toUpperCase()+Rf.slice(1)))}fi(ri,`onAnimationEnd`),fi(ii,`onAnimationIteration`),fi(ai,`onAnimationStart`),fi(`dblclick`,`onDoubleClick`),fi(`focusin`,`onFocus`),fi(`focusout`,`onBlur`),fi(oi,`onTransitionRun`),fi(si,`onTransitionStart`),fi(ci,`onTransitionCancel`),fi(li,`onTransitionEnd`),zt(`onMouseEnter`,[`mouseout`,`mouseover`]),zt(`onMouseLeave`,[`mouseout`,`mouseover`]),zt(`onPointerEnter`,[`pointerout`,`pointerover`]),zt(`onPointerLeave`,[`pointerout`,`pointerover`]),Rt(`onChange`,`change click focusin focusout input keydown keyup selectionchange`.split(` `)),Rt(`onSelect`,`focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange`.split(` `)),Rt(`onBeforeInput`,[`compositionend`,`keypress`,`textInput`,`paste`]),Rt(`onCompositionEnd`,`compositionend focusout keydown keypress keyup mousedown`.split(` `)),Rt(`onCompositionStart`,`compositionstart focusout keydown keypress keyup mousedown`.split(` `)),Rt(`onCompositionUpdate`,`compositionupdate focusout keydown keypress keyup mousedown`.split(` `));var zf=`abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange resize seeked seeking stalled suspend timeupdate volumechange waiting`.split(` `),Bf=new Set(`beforetoggle cancel close invalid load scroll scrollend toggle`.split(` `).concat(zf));function Vf(e,t){t=!!(t&4);for(var n=0;n<e.length;n++){var r=e[n],i=r.event;r=r.listeners;a:{var a=void 0;if(t)for(var o=r.length-1;0<=o;o--){var s=r[o],c=s.instance,l=s.currentTarget;if(s=s.listener,c!==a&&i.isPropagationStopped())break a;a=s,i.currentTarget=l;try{a(i)}catch(e){_i(e)}i.currentTarget=null,a=c}else for(o=0;o<r.length;o++){if(s=r[o],c=s.instance,l=s.currentTarget,s=s.listener,c!==a&&i.isPropagationStopped())break a;a=s,i.currentTarget=l;try{a(i)}catch(e){_i(e)}i.currentTarget=null,a=c}}}}function Q(e,t){var n=t[Ct];n===void 0&&(n=t[Ct]=new Set);var r=e+`__bubble`;n.has(r)||(Gf(t,e,2,!1),n.add(r))}function Hf(e,t,n){var r=0;t&&(r|=4),Gf(n,e,r,t)}var Uf=`_reactListening`+Math.random().toString(36).slice(2);function Wf(e){if(!e[Uf]){e[Uf]=!0,It.forEach(function(t){t!==`selectionchange`&&(Bf.has(t)||Hf(t,!1,e),Hf(t,!0,e))});var t=e.nodeType===9?e:e.ownerDocument;t===null||t[Uf]||(t[Uf]=!0,Hf(`selectionchange`,!1,t))}}function Gf(e,t,n,r){switch(Ch(t)){case 2:var i=_h;break;case 8:i=vh;break;default:i=yh}n=i.bind(null,t,n,e),i=void 0,!En||t!==`touchstart`&&t!==`touchmove`&&t!==`wheel`||(i=!0),r?i===void 0?e.addEventListener(t,n,!0):e.addEventListener(t,n,{capture:!0,passive:i}):i===void 0?e.addEventListener(t,n,!1):e.addEventListener(t,n,{passive:i})}function Kf(e,t,n,r,i){var a=r;if(!(t&1)&&!(t&2)&&r!==null)a:for(;;){if(r===null)return;var s=r.tag;if(s===3||s===4){var c=r.stateNode.containerInfo;if(c===i)break;if(s===4)for(s=r.return;s!==null;){var l=s.tag;if((l===3||l===4)&&s.stateNode.containerInfo===i)return;s=s.return}for(;c!==null;){if(s=At(c),s===null)return;if(l=s.tag,l===5||l===6||l===26||l===27){r=a=s;continue a}c=c.parentNode}}r=r.return}Cn(function(){var r=a,i=vn(n),s=[];a:{var c=ui.get(e);if(c!==void 0){var l=H,u=e;switch(e){case`keypress`:if(Mn(n)===0)break a;case`keydown`:case`keyup`:l=er;break;case`focusin`:u=`focus`,l=Gn;break;case`focusout`:u=`blur`,l=Gn;break;case`beforeblur`:case`afterblur`:l=Gn;break;case`click`:if(n.button===2)break a;case`auxclick`:case`dblclick`:case`mousedown`:case`mousemove`:case`mouseup`:case`mouseout`:case`mouseover`:case`contextmenu`:l=Un;break;case`drag`:case`dragend`:case`dragenter`:case`dragexit`:case`dragleave`:case`dragover`:case`dragstart`:case`drop`:l=Wn;break;case`touchcancel`:case`touchend`:case`touchmove`:case`touchstart`:l=rr;break;case ri:case ii:case ai:l=Kn;break;case li:l=ir;break;case`scroll`:case`scrollend`:l=Rn;break;case`wheel`:l=ar;break;case`copy`:case`cut`:case`paste`:l=qn;break;case`gotpointercapture`:case`lostpointercapture`:case`pointercancel`:case`pointerdown`:case`pointermove`:case`pointerout`:case`pointerover`:case`pointerup`:l=tr;break;case`submit`:l=nr;break;case`toggle`:case`beforetoggle`:l=or}var d=!!(t&4),f=!d&&(e===`scroll`||e===`scrollend`),p=d?c===null?null:c+`Capture`:c;d=[];for(var m=r,h;m!==null;){var g=m;if(h=g.stateNode,g=g.tag,g!==5&&g!==26&&g!==27||h===null||p===null||(g=wn(m,p),g!=null&&d.push(qf(m,g,h))),f)break;m=m.return}0<d.length&&(c=new l(c,u,null,n,i),s.push({event:c,listeners:d}))}}if(!(t&7)){a:{if(l=e===`mouseover`||e===`pointerover`,c=e===`mouseout`||e===`pointerout`,l&&n!==_n&&(u=n.relatedTarget||n.fromElement)&&(At(u)||u[St]))break a;(c||l)&&(u=i.window===i?i:(l=i.ownerDocument)?l.defaultView||l.parentWindow:window,c?(l=n.relatedTarget||n.toElement,c=r,l=l?At(l):null,l!==null&&(f=o(l),d=l.tag,l!==f||d!==5&&d!==27&&d!==6)&&(l=null)):(c=null,l=r),c!==l&&(d=Un,g=`onMouseLeave`,p=`onMouseEnter`,m=`mouse`,(e===`pointerout`||e===`pointerover`)&&(d=tr,g=`onPointerLeave`,p=`onPointerEnter`,m=`pointer`),f=c==null?u:Mt(c),h=l==null?u:Mt(l),u=new d(g,m+`leave`,c,n,i),u.target=f,u.relatedTarget=h,g=null,At(i)===r&&(d=new d(p,m+`enter`,l,n,i),d.target=h,d.relatedTarget=f,g=d),f=g,d=c&&l?E(c,l,Yf):null,c!==null&&Xf(s,u,c,d,!1),l!==null&&f!==null&&Xf(s,f,l,d,!0)))}a:{if(c=r?Mt(r):window,l=c.nodeName&&c.nodeName.toLowerCase(),l===`select`||l===`input`&&c.type===`file`)var _=Er;else if(br(c)){if(Dr)_=Ir;else{_=Pr;var v=Nr}}else l=c.nodeName,!l||l.toLowerCase()!==`input`||c.type!==`checkbox`&&c.type!==`radio`?r&&fn(r.elementType)&&(_=Er):_=Fr;if(_&&=_(e,r)){xr(s,_,n,i);break a}v&&v(e,c,r)}switch(v=r?Mt(r):window,e){case`focusin`:(br(v)||v.contentEditable===`true`)&&(qr=v,Jr=r,Yr=null);break;case`focusout`:Yr=Jr=qr=null;break;case`mousedown`:Xr=!0;break;case`contextmenu`:case`mouseup`:case`dragend`:Xr=!1,Zr(s,n,i);break;case`selectionchange`:if(Kr)break;case`keydown`:case`keyup`:Zr(s,n,i)}var y;if(cr)b:{switch(e){case`compositionstart`:var b=`onCompositionStart`;break b;case`compositionend`:b=`onCompositionEnd`;break b;case`compositionupdate`:b=`onCompositionUpdate`;break b}b=void 0}else gr?mr(e,n)&&(b=`onCompositionEnd`):e===`keydown`&&n.keyCode===229&&(b=`onCompositionStart`);b&&(dr&&n.locale!==`ko`&&(gr||b!==`onCompositionStart`?b===`onCompositionEnd`&&gr&&(y=jn()):(On=i,kn=`value`in On?On.value:On.textContent,gr=!0)),v=Jf(r,b),0<v.length&&(b=new Jn(b,e,null,n,i),s.push({event:b,listeners:v}),y?b.data=y:(y=hr(n),y!==null&&(b.data=y)))),(y=ur?_r(e,n):vr(e,n))&&(b=Jf(r,`onBeforeInput`),0<b.length&&(v=new Jn(`onBeforeInput`,`beforeinput`,null,n,i),s.push({event:v,listeners:b}),v.data=y)),If(s,e,r,n,i)}Vf(s,t)})}function qf(e,t,n){return{instance:e,listener:t,currentTarget:n}}function Jf(e,t){for(var n=t+`Capture`,r=[];e!==null;){var i=e,a=i.stateNode;if(i=i.tag,i!==5&&i!==26&&i!==27||a===null||(i=wn(e,n),i!=null&&r.unshift(qf(e,i,a)),i=wn(e,t),i!=null&&r.push(qf(e,i,a))),e.tag===3)return r;e=e.return}return[]}function Yf(e){if(e===null)return null;do e=e.return;while(e&&e.tag!==5&&e.tag!==27);return e||null}function Xf(e,t,n,r,i){for(var a=t._reactName,o=[];n!==null&&n!==r;){var s=n,c=s.alternate,l=s.stateNode;if(s=s.tag,c!==null&&c===r)break;s!==5&&s!==26&&s!==27||l===null||(c=l,i?(l=wn(n,a),l!=null&&o.unshift(qf(n,l,c))):i||(l=wn(n,a),l!=null&&o.push(qf(n,l,c)))),n=n.return}o.length!==0&&e.push({event:t,listeners:o})}var Zf=/\r\n?/g,Qf=/\u0000|\uFFFD/g;function $f(e){return(typeof e==`string`?e:``+e).replace(Zf,`
`).replace(Qf,``)}function ep(e,t){return t=$f(t),$f(e)===t}function $(e,t,n,r,a,o){switch(n){case`children`:if(typeof r==`string`)t===`body`||t===`textarea`&&r===``||cn(e,r);else if(typeof r==`number`||typeof r==`bigint`)t!==`body`&&cn(e,``+r);else return;break;case`className`:Kt(e,`class`,r);break;case`tabIndex`:Kt(e,`tabindex`,r);break;case`dir`:case`role`:case`viewBox`:case`width`:case`height`:Kt(e,n,r);break;case`style`:dn(e,r,o);return;case`data`:if(t!==`object`){Kt(e,`data`,r);break}case`src`:case`href`:if(r===``&&(t!==`a`||n!==`href`)||r==null||typeof r==`function`||typeof r==`symbol`||typeof r==`boolean`){e.removeAttribute(n);break}r=hn(r),e.setAttribute(n,r);break;case`action`:case`formAction`:if(typeof r==`function`){e.setAttribute(n,`javascript:throw new Error('A React form was unexpectedly submitted. If you called form.submit() manually, consider using form.requestSubmit() instead. If you\\'re trying to use event.stopPropagation() in a submit event handler, consider also calling event.preventDefault().')`);break}if(typeof o==`function`&&(n===`formAction`?(t!==`input`&&$(e,t,`name`,a.name,a,null),$(e,t,`formEncType`,a.formEncType,a,null),$(e,t,`formMethod`,a.formMethod,a,null),$(e,t,`formTarget`,a.formTarget,a,null)):($(e,t,`encType`,a.encType,a,null),$(e,t,`method`,a.method,a,null),$(e,t,`target`,a.target,a,null))),r==null||typeof r==`symbol`||typeof r==`boolean`){e.removeAttribute(n);break}r=hn(r),e.setAttribute(n,r);break;case`onClick`:r!=null&&(e.onclick=gn);return;case`onScroll`:r!=null&&Q(`scroll`,e);return;case`onScrollEnd`:r!=null&&Q(`scrollend`,e);return;case`dangerouslySetInnerHTML`:if(r!=null){if(typeof r!=`object`||!(`__html`in r))throw Error(i(61));if(n=r.__html,n!=null){if(a.children!=null)throw Error(i(60));o?.__html!==n&&(e.innerHTML=n)}}break;case`multiple`:e.multiple=r&&typeof r!=`function`&&typeof r!=`symbol`;break;case`muted`:e.muted=r&&typeof r!=`function`&&typeof r!=`symbol`;break;case`suppressContentEditableWarning`:case`suppressHydrationWarning`:case`defaultValue`:case`defaultChecked`:case`innerHTML`:case`ref`:break;case`autoFocus`:break;case`xlinkHref`:if(r==null||typeof r==`function`||typeof r==`boolean`||typeof r==`symbol`){e.removeAttribute(`xlink:href`);break}n=hn(r),e.setAttributeNS(`http://www.w3.org/1999/xlink`,`xlink:href`,n);break;case`contentEditable`:case`spellCheck`:case`draggable`:case`value`:case`autoReverse`:case`externalResourcesRequired`:case`focusable`:case`preserveAlpha`:r!=null&&typeof r!=`function`&&typeof r!=`symbol`?e.setAttribute(n,r):e.removeAttribute(n);break;case`inert`:case`allowFullScreen`:case`async`:case`autoPlay`:case`controls`:case`credentialless`:case`default`:case`defer`:case`disabled`:case`disablePictureInPicture`:case`disableRemotePlayback`:case`formNoValidate`:case`hidden`:case`loop`:case`noModule`:case`noValidate`:case`open`:case`playsInline`:case`readOnly`:case`required`:case`reversed`:case`scoped`:case`seamless`:case`itemScope`:r&&typeof r!=`function`&&typeof r!=`symbol`?e.setAttribute(n,``):e.removeAttribute(n);break;case`capture`:case`download`:!0===r?e.setAttribute(n,``):!1!==r&&r!=null&&typeof r!=`function`&&typeof r!=`symbol`?e.setAttribute(n,r):e.removeAttribute(n);break;case`cols`:case`rows`:case`size`:case`span`:r!=null&&typeof r!=`function`&&typeof r!=`symbol`&&!isNaN(r)&&1<=r?e.setAttribute(n,r):e.removeAttribute(n);break;case`rowSpan`:case`start`:r==null||typeof r==`function`||typeof r==`symbol`||isNaN(r)?e.removeAttribute(n):e.setAttribute(n,r);break;case`popover`:Q(`beforetoggle`,e),Q(`toggle`,e),Gt(e,`popover`,r);break;case`xlinkActuate`:qt(e,`http://www.w3.org/1999/xlink`,`xlink:actuate`,r);break;case`xlinkArcrole`:qt(e,`http://www.w3.org/1999/xlink`,`xlink:arcrole`,r);break;case`xlinkRole`:qt(e,`http://www.w3.org/1999/xlink`,`xlink:role`,r);break;case`xlinkShow`:qt(e,`http://www.w3.org/1999/xlink`,`xlink:show`,r);break;case`xlinkTitle`:qt(e,`http://www.w3.org/1999/xlink`,`xlink:title`,r);break;case`xlinkType`:qt(e,`http://www.w3.org/1999/xlink`,`xlink:type`,r);break;case`xmlBase`:qt(e,`http://www.w3.org/XML/1998/namespace`,`xml:base`,r);break;case`xmlLang`:qt(e,`http://www.w3.org/XML/1998/namespace`,`xml:lang`,r);break;case`xmlSpace`:qt(e,`http://www.w3.org/XML/1998/namespace`,`xml:space`,r);break;case`is`:Gt(e,`is`,r);break;case`innerText`:case`textContent`:return;default:if(!(2<n.length)||n[0]!==`o`&&n[0]!==`O`||n[1]!==`n`&&n[1]!==`N`)n=pn.get(n)||n,Gt(e,n,r);else return}V=!0}function tp(e,t,n,r,a,o){switch(n){case`style`:dn(e,r,o);return;case`dangerouslySetInnerHTML`:if(r!=null){if(typeof r!=`object`||!(`__html`in r))throw Error(i(61));if(n=r.__html,n!=null){if(a.children!=null)throw Error(i(60));o?.__html!==n&&(e.innerHTML=n)}}break;case`children`:if(typeof r==`string`)cn(e,r);else if(typeof r==`number`||typeof r==`bigint`)cn(e,``+r);else return;break;case`onScroll`:r!=null&&Q(`scroll`,e);return;case`onScrollEnd`:r!=null&&Q(`scrollend`,e);return;case`onClick`:r!=null&&(e.onclick=gn);return;case`suppressContentEditableWarning`:case`suppressHydrationWarning`:case`innerHTML`:case`ref`:return;case`innerText`:case`textContent`:return;default:if(!Lt.hasOwnProperty(n))a:{if(n[0]===`o`&&n[1]===`n`&&(a=n.endsWith(`Capture`),o=n.slice(2,a?n.length-7:void 0),t=e[xt]||null,t=t==null?null:t[n],typeof t==`function`&&e.removeEventListener(o,t,a),typeof r==`function`)){typeof t!=`function`&&t!==null&&(n in e?e[n]=null:e.hasAttribute(n)&&e.removeAttribute(n)),e.addEventListener(o,r,a);break a}V=!0,n in e?e[n]=r:!0===r?e.setAttribute(n,``):Gt(e,n,r)}return}V=!0}function np(e,t,n){switch(t){case`div`:case`span`:case`svg`:case`path`:case`a`:case`g`:case`p`:case`li`:break;case`img`:Q(`error`,e),Q(`load`,e);var r=!1,a=!1,o;for(o in n)if(n.hasOwnProperty(o)){var s=n[o];if(s!=null)switch(o){case`src`:r=!0;break;case`srcSet`:a=!0;break;case`children`:case`dangerouslySetInnerHTML`:throw Error(i(137,t));default:$(e,t,o,s,n,null)}}a&&$(e,t,`srcSet`,n.srcSet,n,null),r&&$(e,t,`src`,n.src,n,null);return;case`input`:Q(`invalid`,e);var c=o=s=a=null,l=null,u=null;for(r in n)if(n.hasOwnProperty(r)){var d=n[r];if(d!=null)switch(r){case`name`:a=d;break;case`type`:s=d;break;case`checked`:l=d;break;case`defaultChecked`:u=d;break;case`value`:o=d;break;case`defaultValue`:c=d;break;case`children`:case`dangerouslySetInnerHTML`:if(d!=null)throw Error(i(137,t));break;default:$(e,t,r,d,n,null)}}nn(e,o,c,l,u,s,a,!1);return;case`select`:for(a in Q(`invalid`,e),r=s=o=null,n)if(n.hasOwnProperty(a)&&(c=n[a],c!=null))switch(a){case`value`:o=c;break;case`defaultValue`:s=c;break;case`multiple`:r=c;default:$(e,t,a,c,n,null)}t=o,n=s,e.multiple=!!r,t==null?n!=null&&an(e,!!r,n,!0):an(e,!!r,t,!1);return;case`textarea`:for(s in Q(`invalid`,e),o=a=r=null,n)if(n.hasOwnProperty(s)&&(c=n[s],c!=null))switch(s){case`value`:r=c;break;case`defaultValue`:a=c;break;case`children`:o=c;break;case`dangerouslySetInnerHTML`:if(c!=null)throw Error(i(91));break;default:$(e,t,s,c,n,null)}sn(e,r,a,o);return;case`option`:for(l in n)if(n.hasOwnProperty(l)&&(r=n[l],r!=null))switch(l){case`selected`:e.selected=r&&typeof r!=`function`&&typeof r!=`symbol`;break;default:$(e,t,l,r,n,null)}return;case`dialog`:Q(`beforetoggle`,e),Q(`toggle`,e),Q(`cancel`,e),Q(`close`,e);break;case`iframe`:case`object`:Q(`load`,e);break;case`video`:case`audio`:for(r=0;r<zf.length;r++)Q(zf[r],e);break;case`image`:Q(`error`,e),Q(`load`,e);break;case`details`:Q(`toggle`,e);break;case`embed`:case`source`:case`link`:Q(`error`,e),Q(`load`,e);case`area`:case`base`:case`br`:case`col`:case`hr`:case`keygen`:case`meta`:case`param`:case`track`:case`wbr`:case`menuitem`:for(u in n)if(n.hasOwnProperty(u)&&(r=n[u],r!=null))switch(u){case`children`:case`dangerouslySetInnerHTML`:throw Error(i(137,t));default:$(e,t,u,r,n,null)}return;default:if(fn(t)){for(d in n)n.hasOwnProperty(d)&&(r=n[d],r!==void 0&&tp(e,t,d,r,n,void 0));return}}for(c in n)n.hasOwnProperty(c)&&(r=n[c],r!=null&&$(e,t,c,r,n,null))}var rp={};function ip(e,t,n,r){switch(t){case`div`:case`span`:case`svg`:case`path`:case`a`:case`g`:case`p`:case`li`:break;case`input`:var a=null,o=null,s=null,c=null,l=null,u=null,d=null;for(m in n){var f=n[m];if(n.hasOwnProperty(m)&&f!=null)switch(m){case`checked`:break;case`value`:break;case`defaultValue`:l=f;default:r.hasOwnProperty(m)||$(e,t,m,null,r,f)}}for(var p in r){var m=r[p];if(f=n[p],r.hasOwnProperty(p)&&(m!=null||f!=null))switch(p){case`type`:m!==f&&(V=!0),o=m;break;case`name`:m!==f&&(V=!0),a=m;break;case`checked`:m!==f&&(V=!0),u=m;break;case`defaultChecked`:m!==f&&(V=!0),d=m;break;case`value`:m!==f&&(V=!0),s=m;break;case`defaultValue`:m!==f&&(V=!0),c=m;break;case`children`:case`dangerouslySetInnerHTML`:if(m!=null)throw Error(i(137,t));break;default:m!==f&&$(e,t,p,m,r,f)}}tn(e,s,c,l,u,d,o,a);return;case`select`:for(o in m=s=c=p=null,n)if(l=n[o],n.hasOwnProperty(o)&&l!=null)switch(o){case`value`:break;case`multiple`:m=l;default:r.hasOwnProperty(o)||$(e,t,o,null,r,l)}for(a in r)if(o=r[a],l=n[a],r.hasOwnProperty(a)&&(o!=null||l!=null))switch(a){case`value`:o!==l&&(V=!0),p=o;break;case`defaultValue`:o!==l&&(V=!0),c=o;break;case`multiple`:o!==l&&(V=!0),s=o;default:o!==l&&$(e,t,a,o,r,l)}t=c,n=s,r=m,p==null?!!r!=!!n&&(t==null?an(e,!!n,n?[]:``,!1):an(e,!!n,t,!0)):an(e,!!n,p,!1);return;case`textarea`:for(c in m=p=null,n)if(a=n[c],n.hasOwnProperty(c)&&a!=null&&!r.hasOwnProperty(c))switch(c){case`value`:break;case`children`:break;default:$(e,t,c,null,r,a)}for(s in r)if(a=r[s],o=n[s],r.hasOwnProperty(s)&&(a!=null||o!=null))switch(s){case`value`:a!==o&&(V=!0),p=a;break;case`defaultValue`:a!==o&&(V=!0),m=a;break;case`children`:break;case`dangerouslySetInnerHTML`:if(a!=null)throw Error(i(91));break;default:a!==o&&$(e,t,s,a,r,o)}on(e,p,m);return;case`option`:for(var h in n)if(p=n[h],n.hasOwnProperty(h)&&p!=null&&!r.hasOwnProperty(h))switch(h){case`selected`:e.selected=!1;break;default:$(e,t,h,null,r,p)}for(l in r)if(p=r[l],m=n[l],r.hasOwnProperty(l)&&p!==m&&(p!=null||m!=null))switch(l){case`selected`:p!==m&&(V=!0),e.selected=p&&typeof p!=`function`&&typeof p!=`symbol`;break;default:$(e,t,l,p,r,m)}return;case`img`:case`link`:case`area`:case`base`:case`br`:case`col`:case`embed`:case`hr`:case`keygen`:case`meta`:case`param`:case`source`:case`track`:case`wbr`:case`menuitem`:for(var g in n)p=n[g],n.hasOwnProperty(g)&&p!=null&&!r.hasOwnProperty(g)&&$(e,t,g,null,r,p);for(u in r)if(p=r[u],m=n[u],r.hasOwnProperty(u)&&p!==m&&(p!=null||m!=null))switch(u){case`children`:case`dangerouslySetInnerHTML`:if(p!=null)throw Error(i(137,t));break;default:$(e,t,u,p,r,m)}return;default:if(fn(t)){for(var _ in n)p=n[_],n.hasOwnProperty(_)&&p!==void 0&&!r.hasOwnProperty(_)&&tp(e,t,_,void 0,r,p);for(d in r)p=r[d],m=n[d],!r.hasOwnProperty(d)||p===m||p===void 0&&m===void 0||tp(e,t,d,p,r,m);return}}for(var v in n)p=n[v],n.hasOwnProperty(v)&&p!=null&&!r.hasOwnProperty(v)&&$(e,t,v,null,r,p);for(f in r)p=r[f],m=n[f],!r.hasOwnProperty(f)||p===m||p==null&&m==null||$(e,t,f,p,r,m)}function ap(e){switch(e){case`css`:case`script`:case`font`:case`img`:case`image`:case`input`:case`link`:return!0;default:return!1}}function op(){if(typeof performance.getEntriesByType==`function`){for(var e=0,t=0,n=performance.getEntriesByType(`resource`),r=0;r<n.length;r++){var i=n[r],a=i.transferSize,o=i.initiatorType,s=i.duration;if(a&&s&&ap(o)){for(o=0,s=i.responseEnd,r+=1;r<n.length;r++){var c=n[r],l=c.startTime;if(l>s)break;var u=c.transferSize,d=c.initiatorType;u&&ap(d)&&(c=c.responseEnd,o+=u*(c<s?1:(s-l)/(c-l)))}if(--r,t+=8*(a+o)/(i.duration/1e3),e++,10<e)break}}if(0<e)return t/e/1e6}return navigator.connection&&(e=navigator.connection.downlink,typeof e==`number`)?e:5}var sp=null,cp=null;function lp(e){return e.nodeType===9?e:e.ownerDocument}function up(e){switch(e){case`http://www.w3.org/2000/svg`:return 1;case`http://www.w3.org/1998/Math/MathML`:return 2;default:return 0}}function dp(e,t){if(e===0)switch(t){case`svg`:return 1;case`math`:return 2;default:return 0}return e===1&&t===`foreignObject`?0:e}function fp(e,t,n,r){return n=lp(n).createElement(e),n[bt]=r,n[xt]=t,np(n,e,t),Pt(n),n}function pp(e,t){return e===`textarea`||e===`noscript`||typeof t.children==`string`||typeof t.children==`number`||typeof t.children==`bigint`||typeof t.dangerouslySetInnerHTML==`object`&&t.dangerouslySetInnerHTML!==null&&t.dangerouslySetInnerHTML.__html!=null}var mp=null;function hp(){var e=window.event;return e&&e.type===`popstate`?e!==mp&&(mp=e,!0):(mp=null,!1)}var gp=typeof setTimeout==`function`?setTimeout:void 0,_p=typeof clearTimeout==`function`?clearTimeout:void 0,vp=typeof Promise==`function`?Promise:void 0,yp=typeof requestAnimationFrame==`function`?requestAnimationFrame:gp,bp=typeof queueMicrotask==`function`?queueMicrotask:vp===void 0?gp:function(e){return vp.resolve(null).then(e).catch(xp)};function xp(e){setTimeout(function(){throw e})}function Sp(e){return e===`head`}function Cp(e,t){var n=t,r=0;do{var i=n.nextSibling;if(e.removeChild(n),i&&i.nodeType===8){if(n=i.data,n===`/$`||n===`/&`){if(r===0){e.removeChild(i),Hh(t);return}r--}else if(n===`$`||n===`$?`||n===`$~`||n===`$!`||n===`&`)r++;else if(n===`html`)_m(e.ownerDocument.documentElement);else if(n===`head`){n=e.ownerDocument.head,_m(n);for(var a=n.firstChild;a;){var o=a.nextSibling,s=a.nodeName;a[Dt]||s===`SCRIPT`||s===`STYLE`||s===`LINK`&&a.rel.toLowerCase()===`stylesheet`||n.removeChild(a),a=o}}else n===`body`&&_m(e.ownerDocument.body)}n=i}while(n);Hh(t)}function wp(e,t){var n=e;e=0;do{var r=n.nextSibling;if(n.nodeType===1?t?(n._stashedDisplay=n.style.display,n.style.display=`none`):(n.style.display=n._stashedDisplay||``,n.getAttribute(`style`)===``&&n.removeAttribute(`style`)):n.nodeType===3&&(t?(n._stashedText=n.nodeValue,n.nodeValue=``):n.nodeValue=n._stashedText||``),r&&r.nodeType===8){if(n=r.data,n===`/$`){if(e===0)break;e--}else n!==`$`&&n!==`$?`&&n!==`$~`&&n!==`$!`||e++}n=r}while(n)}function Tp(e,t,n){if(t=CSS.escape(t)===t?t:`r-`+btoa(t).replace(/=/g,``),e.style.viewTransitionName=t,n!=null&&(e.style.viewTransitionClass=n),n=getComputedStyle(e),n.display===`inline`){if(t=e.getClientRects(),t.length===1)var r=1;else for(var i=r=0;i<t.length;i++){var a=t[i];0<a.width&&0<a.height&&r++}r===1&&(e=e.style,e.display=t.length===1?`inline-block`:`block`,e.marginTop=`-`+n.paddingTop,e.marginBottom=`-`+n.paddingBottom)}}function Ep(e,t){e=e.style,t=t.style;var n=t==null?null:t.hasOwnProperty(`viewTransitionName`)?t.viewTransitionName:t.hasOwnProperty(`view-transition-name`)?t[`view-transition-name`]:null;e.viewTransitionName=n==null||typeof n==`boolean`?``:(``+n).trim(),n=t==null?null:t.hasOwnProperty(`viewTransitionClass`)?t.viewTransitionClass:t.hasOwnProperty(`view-transition-class`)?t[`view-transition-class`]:null,e.viewTransitionClass=n==null||typeof n==`boolean`?``:(``+n).trim(),e.display===`inline-block`&&(t==null?e.display=e.margin=``:(n=t.display,e.display=n==null||typeof n==`boolean`?``:n,n=t.margin,n==null?(n=t.hasOwnProperty(`marginTop`)?t.marginTop:t[`margin-top`],e.marginTop=n==null||typeof n==`boolean`?``:n,t=t.hasOwnProperty(`marginBottom`)?t.marginBottom:t[`margin-bottom`],e.marginBottom=t==null||typeof t==`boolean`?``:t):e.margin=n))}function Dp(e,t,n){return n=n.ownerDocument.defaultView,{rect:e,abs:t.position===`absolute`||t.position===`fixed`,clip:t.clipPath!==`none`||t.overflow!==`visible`||t.filter!==`none`||t.mask!==`none`||t.mask!==`none`||t.borderRadius!==`0px`,view:0<=e.bottom&&0<=e.right&&e.top<=n.innerHeight&&e.left<=n.innerWidth}}function Op(e){return Dp(e.getBoundingClientRect(),getComputedStyle(e),e)}function kp(e){var t=e.getBoundingClientRect();t=new DOMRect(t.x+2e4,t.y+2e4,t.width,t.height);var n=getComputedStyle(e);return Dp(t,n,e)}function Ap(e){return e.documentElement.clientHeight}function jp(e){this.addEventListener(`load`,e),this.addEventListener(`error`,e)}function Mp(e,t,n,r,i,a,o,s,c){var l=t.nodeType===9?t:t.ownerDocument;try{var u=l.startViewTransition({update:function(){var t=l.defaultView,n=t.navigation&&t.navigation.transition,o=l.fonts.status;r();var s=[];if(o===`loaded`&&(Ap(l),l.fonts.status===`loading`&&s.push(l.fonts.ready)),o=s.length,e!==null)for(var c=e.suspenseyImages,u=0,d=0;d<c.length;d++){var f=c[d];if(!f.complete){var p=f.getBoundingClientRect();if(0<p.bottom&&0<p.right&&p.top<t.innerHeight&&p.left<t.innerWidth){if(u+=Xm(f),u>$m){s.length=o;break}f=new Promise(jp.bind(f)),s.push(f)}}}if(0<s.length)return t=Promise.race([Promise.all(s),new Promise(function(e){return setTimeout(e,500)})]).then(i,i),(n?Promise.allSettled([n.finished,t]):t).then(a,a);if(i(),n)return n.finished.then(a,a);a()},types:n});l.__reactViewTransition=u;var d=[];return u.ready.then(function(){for(var e=l.documentElement.getAnimations({subtree:!0}),t=0;t<e.length;t++){var n=e[t],r=n.effect,i=r.pseudoElement;if(i!=null&&i.startsWith(`::view-transition`)){d.push(n),n=r.getKeyframes();for(var a=i=void 0,s=!0,c=0;c<n.length;c++){var u=n[c],f=u.width;if(i===void 0)i=f;else if(i!==f){s=!1;break}if(f=u.height,a===void 0)a=f;else if(a!==f){s=!1;break}delete u.width,delete u.height,u.transform===`none`&&delete u.transform}s&&i!==void 0&&a!==void 0&&(r.setKeyframes(n),s=getComputedStyle(r.target,r.pseudoElement),s.width!==i||s.height!==a)&&(s=n[0],s.width=i,s.height=a,s=n[n.length-1],s.width=i,s.height=a,r.setKeyframes(n))}}o()},function(e){l.__reactViewTransition===u&&(l.__reactViewTransition=null);try{if(typeof e==`object`&&e)switch(e.name){case`InvalidStateError`:(e.message===`View transition was skipped because document visibility state is hidden.`||e.message===`Skipping view transition because document visibility state has become hidden.`||e.message===`Skipping view transition because viewport size changed.`||e.message===`Transition was aborted because of invalid state`)&&(e=null)}e!==null&&c(e)}finally{r(),i(),o()}}),u.finished.finally(function(){for(var e=0;e<d.length;e++)d[e].cancel();l.__reactViewTransition===u&&(l.__reactViewTransition=null),s()}),u}catch{return r(),i(),o(),null}}function Np(e,t){this._scope=document.documentElement,this._selector=`::view-transition-`+e+`(`+t+`)`}Np.prototype.animate=function(e,t){return t=typeof t==`number`?{duration:t}:D({},t),t.pseudoElement=this._selector,this._scope.animate(e,t)},Np.prototype.getAnimations=function(){for(var e=this._scope,t=this._selector,n=e.getAnimations({subtree:!0}),r=[],i=0;i<n.length;i++){var a=n[i].effect;a!==null&&a.target===e&&a.pseudoElement===t&&r.push(n[i])}return r},Np.prototype.getComputedStyle=function(){return getComputedStyle(this._scope,this._selector)};function Pp(e){return{name:e,group:new Np(`group`,e),imagePair:new Np(`image-pair`,e),old:new Np(`old`,e),new:new Np(`new`,e)}}function Fp(e){this._fragmentFiber=e,this._observers=this._eventListeners=null}Fp.prototype.addEventListener=function(e,t,n){var r=null,i=null;if(!(n!=null&&typeof n!=`boolean`&&(r=n.signal||null,r!==null&&r.aborted))){this._eventListeners===null&&(this._eventListeners=[]);var a=this._eventListeners;if(Bp(a,e,t,n)===-1){var o=this,s=t;n!=null&&typeof n!=`boolean`&&!0===n.once&&(s=function(r){o.removeEventListener(e,t,n),typeof t==`function`?t.call(this,r):t.handleEvent(r)}),r!==null&&(i=o.removeEventListener.bind(o,e,t,n),r.addEventListener(`abort`,i,{once:!0}),i=r.removeEventListener.bind(r,`abort`,i)),r=Rp(n),a.push({type:e,listener:t,optionsOrUseCapture:n,attachedListener:s,cleanup:i}),h(this._fragmentFiber.child,!1,Ip,e,s,r)}this._eventListeners=a}};function Ip(e,t,n,r){return b(e).addEventListener(t,n,r),!1}Fp.prototype.removeEventListener=function(e,t,n){var r=this._eventListeners;if(r!==null&&(t=Bp(r,e,t,n),t!==-1)){var i=r[t];n=i.attachedListener;var a=i.cleanup;i=Rp(i.optionsOrUseCapture),h(this._fragmentFiber.child,!1,Lp,e,n,i),r.splice(t,1),a!==null&&a()}};function Lp(e,t,n,r){return b(e).removeEventListener(t,n,r),!1}function Rp(e){return e!=null&&typeof e!=`boolean`&&(!0===e.once||e.signal instanceof AbortSignal)?{capture:e.capture,passive:e.passive}:e}function zp(e){return e==null?`c=0`:typeof e==`boolean`?`c=`+(e?`1`:`0`):`c=`+(e.capture?`1`:`0`)}function Bp(e,t,n,r){if(e.length===0)return-1;r=zp(r);for(var i=0;i<e.length;i++){var a=e[i];if(a.type===t&&a.listener===n&&zp(a.optionsOrUseCapture)===r)return i}return-1}Fp.prototype.dispatchEvent=function(e){var t=g(this._fragmentFiber);if(t===null)return!0;t=b(t);var n=this._eventListeners;if(n!==null&&0<n.length||!e.bubbles){var r=t.nodeType===9?t.createComment(``):document.createTextNode(``);if(n)for(var i=0;i<n.length;i++){var a=n[i];r.addEventListener(a.type,a.attachedListener,Rp(a.optionsOrUseCapture))}if(t.appendChild(r),e=r.dispatchEvent(e),n)for(i=0;i<n.length;i++)a=n[i],r.removeEventListener(a.type,a.attachedListener,Rp(a.optionsOrUseCapture));return t.removeChild(r),e}return t.dispatchEvent(e)},Fp.prototype.focus=function(e){h(this._fragmentFiber.child,!0,Vp,e,void 0,void 0)};function Vp(e,t){return e.tag!==6&&(e=b(e),pm(e,t))}Fp.prototype.focusLast=function(e){var t=[];h(this._fragmentFiber.child,!0,Hp,t,void 0,void 0);for(var n=t.length-1;0<=n&&!Vp(t[n],e);n--);};function Hp(e,t){return t.push(e),!1}Fp.prototype.blur=function(){var e=g(this._fragmentFiber);e!==null&&(e=b(e),e=lp(e).activeElement,e!==null&&h(this._fragmentFiber.child,!1,Up,e,void 0,void 0))};function Up(e,t){return e.tag!==6&&(e=b(e),e===t||e.contains(t)?(t.blur(),!0):!1)}Fp.prototype.observeUsing=function(e){this._observers===null&&(this._observers=new Set),this._observers.add(e),h(this._fragmentFiber.child,!1,Wp,e,void 0,void 0)};function Wp(e,t){return e.tag===6||(e=b(e),t.observe(e)),!1}Fp.prototype.unobserveUsing=function(e){var t=this._observers;if(t!==null&&t.has(e)){t.delete(e),h(this._fragmentFiber.child,!1,Gp,e,void 0,void 0);for(var n=t=0;n<Kp.length;n++){var r=Kp[n];r.fragmentInstance===this&&r.observer===e?e.unobserve(r.instance):Kp[t++]=r}Kp.length=t}};function Gp(e,t){return e.tag===6||(e=b(e),t.unobserve(e)),!1}var Kp=[],qp=!1;function Jp(e,t,n){Kp.push({fragmentInstance:e,observer:t,instance:n}),qp||(qp=!0,mm(function(){qp=!1;var e=Kp;Kp=[];for(var t=0;t<e.length;t++){var n=e[t];n.observer.unobserve(n.instance)}}))}Fp.prototype.getClientRects=function(){var e=[];return h(this._fragmentFiber.child,!1,Yp,e,void 0,void 0),e};function Yp(e,t){if(e.tag===6){e=e.stateNode;var n=e.ownerDocument.createRange();n.selectNodeContents(e),t.push.apply(t,n.getClientRects())}else e=b(e),t.push.apply(t,e.getClientRects());return!1}Fp.prototype.getRootNode=function(e){var t=g(this._fragmentFiber);return t===null?this:b(t).getRootNode(e)},Fp.prototype.compareDocumentPosition=function(e){var t=g(this._fragmentFiber);if(t===null)return Node.DOCUMENT_POSITION_DISCONNECTED;var n=[];h(this._fragmentFiber.child,!1,Hp,n,void 0,void 0);var r=b(t);if(n.length===0){if(n=r,_(this._fragmentFiber)){a:{for(t=this._fragmentFiber.return;t!==null;){if(t.tag===4){t=t.stateNode.containerInfo;break a}if(t.tag===3||t.tag===5||t.tag===27)break;t=t.return}t=null}t!=null&&(n=t)}t=this._fragmentFiber;var i=r=n.compareDocumentPosition(e);return n===e?i=Node.DOCUMENT_POSITION_CONTAINS:r&Node.DOCUMENT_POSITION_CONTAINED_BY&&(n=v(t)[1],n===null?i=Node.DOCUMENT_POSITION_PRECEDING:(e=b(n).compareDocumentPosition(e),i=e===0||e&Node.DOCUMENT_POSITION_FOLLOWING?Node.DOCUMENT_POSITION_FOLLOWING:Node.DOCUMENT_POSITION_PRECEDING)),i|=Node.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC}t=b(n[0]),i=b(n[n.length-1]);var a=_(this._fragmentFiber)?t.parentElement:r;if(a==null)return Node.DOCUMENT_POSITION_DISCONNECTED;r=a.compareDocumentPosition(t)&Node.DOCUMENT_POSITION_CONTAINED_BY,a=a.compareDocumentPosition(i)&Node.DOCUMENT_POSITION_CONTAINED_BY;var o=t.compareDocumentPosition(e),s=i.compareDocumentPosition(e),c=o&Node.DOCUMENT_POSITION_CONTAINED_BY||s&Node.DOCUMENT_POSITION_CONTAINED_BY;return s=r&&a&&o&Node.DOCUMENT_POSITION_FOLLOWING&&s&Node.DOCUMENT_POSITION_PRECEDING,t=r&&t===e||a&&i===e||c||s?Node.DOCUMENT_POSITION_CONTAINED_BY:!r&&t===e||!a&&i===e?Node.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC:o,t&Node.DOCUMENT_POSITION_DISCONNECTED||t&Node.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC||Xp(t,this._fragmentFiber,n[0],n[n.length-1],e)?t:Node.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC};function Xp(e,t,n,r,i){var a=At(i);if(e&Node.DOCUMENT_POSITION_CONTAINED_BY){if(n=!!a)a:{for(;a!==null;){if(a.tag===7&&(a===t||a.alternate===t)){n=!0;break a}a=a.return}n=!1}return n}if(e&Node.DOCUMENT_POSITION_CONTAINS){if(a===null)return a=i.ownerDocument,i===a||i===a.documentElement||i===a.body;a:{for(a=t,t=g(t);a!==null;){if(!(a.tag!==5&&a.tag!==3&&a.tag!==27||a!==t&&a.alternate!==t)){a=!0;break a}a=a.return}a=!1}return a}return e&Node.DOCUMENT_POSITION_PRECEDING?((t=!!a)&&!(t=a===n)&&(t=E(n,a,T),t===null?t=!1:(h(t,!0,C,a,n),a=x,x=null,t=a!==null)),t):e&Node.DOCUMENT_POSITION_FOLLOWING?((t=!!a)&&!(t=a===r)&&(t=E(r,a,T),t===null?t=!1:(h(t,!0,w,a,r),a=x,S=x=null,t=a!==null)),t):!1}function Zp(e,t){var n=e.ownerDocument.createRange();n.selectNodeContents(e),e=n.getBoundingClientRect(),window.scrollTo(window.scrollX+e.left,t?window.scrollY+e.top:window.scrollY+e.bottom-window.innerHeight)}Fp.prototype.scrollIntoView=function(e){if(typeof e==`object`)throw Error(i(566));var t=[];h(this._fragmentFiber.child,!1,Hp,t,void 0,void 0);var n=!1!==e;if(t.length===0){var r=v(this._fragmentFiber);if(r=n?r[1]||r[0]||g(this._fragmentFiber):r[0]||r[1],r===null)return;if(r.tag===6){e=b(r),Zp(e,n);return}if(r=b(r),r.nodeType!==9){if(r.nodeType===11){n=`host`in r?r.host:null,n!==null&&n.scrollIntoView(e);return}r.scrollIntoView(e)}}for(r=n?t.length-1:0;r!==(n?-1:t.length);){var a=t[r];a.tag===6?(a=b(a),Zp(a,n)):b(a).scrollIntoView(e),r+=n?-1:1}};function Qp(e,t){return e=b(e),$p(e,t),!1}function $p(e,t){e.reactFragments??=new Set,e.reactFragments.add(t)}function em(e,t){var n=t._eventListeners;if(n!==null)for(var r=0;r<n.length;r++){var i=n[r];e.addEventListener(i.type,i.attachedListener,Rp(i.optionsOrUseCapture))}e.nodeType!==3&&(n=t._observers,n!==null&&n.forEach(function(n){for(var r=0,i=0;i<Kp.length;i++){var a=Kp[i];(a.fragmentInstance!==t||a.observer!==n||a.instance!==e)&&(Kp[r++]=a)}Kp.length=r,n.observe(e)}),$p(e,t))}function tm(e,t){var n=t._eventListeners;if(n!==null)for(var r=0;r<n.length;r++){var i=n[r];e.removeEventListener(i.type,i.attachedListener,Rp(i.optionsOrUseCapture))}e.nodeType!==3&&(n=t._observers,n!==null&&n.forEach(function(n){typeof n.rootMargin==`string`?Jp(t,n,e):n.unobserve(e)}),e.reactFragments!=null&&e.reactFragments.delete(t))}function nm(e){var t=e.firstChild;for(t&&t.nodeType===10&&(t=t.nextSibling);t;){var n=t;switch(t=t.nextSibling,n.nodeName){case`HTML`:case`HEAD`:case`BODY`:nm(n),kt(n);continue;case`SCRIPT`:case`STYLE`:continue;case`LINK`:if(n.rel.toLowerCase()===`stylesheet`)continue}e.removeChild(n)}}function rm(e,t,n,r){for(;e.nodeType===1;){var i=n;if(e.nodeName.toLowerCase()!==t.toLowerCase()){if(!r&&(e.nodeName!==`INPUT`||e.type!==`hidden`))break}else if(!r){if(t===`input`&&e.type===`hidden`){var a=i.name==null?null:``+i.name;if(i.type===`hidden`&&e.getAttribute(`name`)===a)return e}else return e}else if(!e[Dt])switch(t){case`meta`:if(!e.hasAttribute(`itemprop`))break;return e;case`link`:if(a=e.getAttribute(`rel`),a===`stylesheet`&&e.hasAttribute(`data-precedence`)||a!==i.rel||e.getAttribute(`href`)!==(i.href==null||i.href===``?null:i.href)||e.getAttribute(`crossorigin`)!==(i.crossOrigin==null?null:i.crossOrigin)||e.getAttribute(`title`)!==(i.title==null?null:i.title))break;return e;case`style`:if(e.hasAttribute(`data-precedence`))break;return e;case`script`:if(a=e.getAttribute(`src`),(a!==(i.src==null?null:i.src)||e.getAttribute(`type`)!==(i.type==null?null:i.type)||e.getAttribute(`crossorigin`)!==(i.crossOrigin==null?null:i.crossOrigin))&&a&&e.hasAttribute(`async`)&&!e.hasAttribute(`itemprop`))break;return e;default:return e}if(e=lm(e.nextSibling),e===null)break}return null}function im(e,t,n){if(t===``)return null;for(;e.nodeType!==3;)if((e.nodeType!==1||e.nodeName!==`INPUT`||e.type!==`hidden`)&&!n||(e=lm(e.nextSibling),e===null))return null;return e}function am(e,t){for(;e.nodeType!==8;)if((e.nodeType!==1||e.nodeName!==`INPUT`||e.type!==`hidden`)&&!t||(e=lm(e.nextSibling),e===null))return null;return e}function om(e){return e.data===`$?`||e.data===`$~`}function sm(e){return e.data===`$!`||e.data===`$?`&&e.ownerDocument.readyState!==`loading`}function cm(e,t){var n=e.ownerDocument;if(e.data===`$~`)e._reactRetry=t;else if(e.data!==`$?`||n.readyState!==`loading`)t();else{var r=function(){t(),n.removeEventListener(`DOMContentLoaded`,r)};n.addEventListener(`DOMContentLoaded`,r),e._reactRetry=r}}function lm(e){for(;e!=null;e=e.nextSibling){var t=e.nodeType;if(t===1||t===3)break;if(t===8){if(t=e.data,t===`$`||t===`$!`||t===`$?`||t===`$~`||t===`&`||t===`F!`||t===`F`)break;if(t===`/$`||t===`/&`)return null}}return e}var um=null;function dm(e){e=e.nextSibling;for(var t=0;e;){if(e.nodeType===8){var n=e.data;if(n===`/$`||n===`/&`){if(t===0)return lm(e.nextSibling);t--}else n!==`$`&&n!==`$!`&&n!==`$?`&&n!==`$~`&&n!==`&`||t++}e=e.nextSibling}return null}function fm(e){e=e.previousSibling;for(var t=0;e;){if(e.nodeType===8){var n=e.data;if(n===`$`||n===`$!`||n===`$?`||n===`$~`||n===`&`){if(t===0)return e;t--}else n!==`/$`&&n!==`/&`||t++}e=e.previousSibling}return null}function pm(e,t){function n(){r=!0}if(e.ownerDocument.activeElement===e)return!0;var r=!1;try{e.ownerDocument.addEventListener(`focus`,n,!0),(e.focus||HTMLElement.prototype.focus).call(e,t)}finally{e.ownerDocument.removeEventListener(`focus`,n,!0)}return r}function mm(e){yp(function(){yp(function(t){return e(t)})})}function hm(e,t,n){switch(t=lp(n),e){case`html`:if(e=t.documentElement,!e)throw Error(i(452));return e;case`head`:if(e=t.head,!e)throw Error(i(453));return e;case`body`:if(e=t.body,!e)throw Error(i(454));return e;default:throw Error(i(451))}}function gm(e,t,n){for(var r in n){var i=n[r];n.hasOwnProperty(r)&&i!=null&&$(e,t,r,null,rp,i)}n.dangerouslySetInnerHTML!=null&&(e.textContent=``),e.onclick===gn&&(e.onclick=null),kt(e)}function _m(e){for(var t=e.attributes;t.length;)e.removeAttributeNode(t[0]);kt(e)}var vm=new Map,ym=new Set;function bm(e){if(typeof e.getRootNode==`function`){var t=e.getRootNode();if(t.nodeType===9||t.nodeType===11)return t}return e.nodeType===9?e:e.ownerDocument}var xm=z.d;z.d={f:Sm,r:Cm,D:Em,C:Dm,L:Om,m:km,X:jm,S:Am,M:Mm};function Sm(){var e=xm.f(),t=zd();return e||t}function Cm(e){var t=jt(e);t!==null&&t.tag===5&&t.type===`form`?ec(t):xm.r(e)}var wm=typeof document>`u`?null:document;function Tm(e,t,n){var r=wm;if(r&&typeof t==`string`&&t){var i=en(t);i=`link[rel="`+e+`"][href="`+i+`"]`,typeof n==`string`&&(i+=`[crossorigin="`+n+`"]`),ym.has(i)||(ym.add(i),e={rel:e,crossOrigin:n,href:t},r.querySelector(i)===null&&(t=r.createElement(`link`),np(t,`link`,e),Pt(t),r.head.appendChild(t)))}}function Em(e){xm.D(e),Tm(`dns-prefetch`,e,null)}function Dm(e,t){xm.C(e,t),Tm(`preconnect`,e,t)}function Om(e,t,n){xm.L(e,t,n);var r=wm;if(r&&e&&t){var i=`link[rel="preload"][as="`+en(t)+`"]`;t===`image`&&n&&n.imageSrcSet?(i+=`[imagesrcset="`+en(n.imageSrcSet)+`"]`,typeof n.imageSizes==`string`&&(i+=`[imagesizes="`+en(n.imageSizes)+`"]`)):i+=`[href="`+en(e)+`"]`;var a=i;switch(t){case`style`:a=Pm(e);break;case`script`:a=Rm(e)}if(!(vm.has(a)||(e=D({rel:`preload`,href:t===`image`&&n&&n.imageSrcSet?void 0:e,as:t},n),vm.set(a,e),r.querySelector(i)!==null||t===`style`&&r.querySelector(Fm(a))||t===`script`&&r.querySelector(zm(a))))){var o=r.createElement(`link`);np(o,`link`,e),t===`style`&&(o[Ot]=!0,o.onload=o.onerror=function(){Ft(o)}),Pt(o),r.head.appendChild(o)}}}function km(e,t){xm.m(e,t);var n=wm;if(n&&e){var r=t&&typeof t.as==`string`?t.as:`script`,i=`link[rel="modulepreload"][as="`+en(r)+`"][href="`+en(e)+`"]`,a=i;switch(r){case`audioworklet`:case`paintworklet`:case`serviceworker`:case`sharedworker`:case`worker`:case`script`:a=Rm(e)}if(!vm.has(a)&&(e=D({rel:`modulepreload`,href:e},t),vm.set(a,e),n.querySelector(i)===null)){switch(r){case`audioworklet`:case`paintworklet`:case`serviceworker`:case`sharedworker`:case`worker`:case`script`:if(n.querySelector(zm(a)))return}r=n.createElement(`link`),np(r,`link`,e),Pt(r),n.head.appendChild(r)}}}function Am(e,t,n){xm.S(e,t,n);var r=wm;if(r&&e){var i=Nt(r).hoistableStyles,a=Pm(e);t||=`default`;var o=i.get(a);if(!o){var s={loading:0,preload:null};if(o=r.querySelector(Fm(a)))s.loading=5;else{e=D({rel:`stylesheet`,href:e,"data-precedence":t},n),(n=vm.get(a))&&Hm(e,n);var c=o=r.createElement(`link`);Pt(c),np(c,`link`,e),c._p=new Promise(function(e,t){c.onload=e,c.onerror=t}),c.addEventListener(`load`,function(){s.loading|=1}),c.addEventListener(`error`,function(){s.loading|=2}),s.loading|=4,Vm(o,t,r)}o={type:`stylesheet`,instance:o,count:1,state:s},i.set(a,o)}}}function jm(e,t){xm.X(e,t);var n=wm;if(n&&e){var r=Nt(n).hoistableScripts,i=Rm(e),a=r.get(i);a||(a=n.querySelector(zm(i)),a||(e=D({src:e,async:!0},t),(t=vm.get(i))&&Um(e,t),a=n.createElement(`script`),Pt(a),np(a,`link`,e),n.head.appendChild(a)),a={type:`script`,instance:a,count:1,state:null},r.set(i,a))}}function Mm(e,t){xm.M(e,t);var n=wm;if(n&&e){var r=Nt(n).hoistableScripts,i=Rm(e),a=r.get(i);a||(a=n.querySelector(zm(i)),a||(e=D({src:e,async:!0,type:`module`},t),(t=vm.get(i))&&Um(e,t),a=n.createElement(`script`),Pt(a),np(a,`link`,e),n.head.appendChild(a)),a={type:`script`,instance:a,count:1,state:null},r.set(i,a))}}function Nm(e,t,n,r){var a=(a=be.current)?bm(a):null;if(!a)throw Error(i(446));switch(e){case`meta`:case`title`:return null;case`style`:return typeof n.precedence==`string`&&typeof n.href==`string`?(n=Pm(n.href),t=Nt(a).hoistableStyles,r=t.get(n),r||(r={type:`style`,instance:null,count:0,state:null},t.set(n,r)),r):{type:`void`,instance:null,count:0,state:null};case`link`:if(n.rel===`stylesheet`&&typeof n.href==`string`&&typeof n.precedence==`string`){e=Pm(n.href);var o=Nt(a).hoistableStyles,s=o.get(e);if(s||(a=a.ownerDocument||a,s={type:`stylesheet`,instance:null,count:0,state:{loading:0,preload:null}},o.set(e,s),(o=a.querySelector(Fm(e)))?o._p||(s.instance=o,s.state.loading=5):(o=vm.get(e),o||(o={rel:`preload`,as:`style`,href:n.href,crossOrigin:n.crossOrigin,integrity:n.integrity,media:n.media,hrefLang:n.hrefLang,referrerPolicy:n.referrerPolicy},vm.set(e,o)),Lm(a,e,o,s.state))),t&&r===null)throw Error(i(528,``));return s}if(t&&r!==null)throw Error(i(529,``));return null;case`script`:return t=n.async,n=n.src,typeof n==`string`&&t&&typeof t!=`function`&&typeof t!=`symbol`?(n=Rm(n),t=Nt(a).hoistableScripts,r=t.get(n),r||(r={type:`script`,instance:null,count:0,state:null},t.set(n,r)),r):{type:`void`,instance:null,count:0,state:null};default:throw Error(i(444,e))}}function Pm(e){return`href="`+en(e)+`"`}function Fm(e){return`link[rel="stylesheet"][`+e+`]`}function Im(e){return D({},e,{"data-precedence":e.precedence,precedence:null})}function Lm(e,t,n,r){if(t=e.querySelector(`link[rel="preload"][as="style"][`+t+`]`)){if(!0!==t[Ot]){r.loading=1;return}}else t=e.createElement(`link`),t[Ot]=!0,t.onload=t.onerror=Ft.bind(null,t),np(t,`link`,n),Pt(t),e.head.appendChild(t);r.preload=t,t.addEventListener(`load`,function(){return r.loading|=1}),t.addEventListener(`error`,function(){return r.loading|=2})}function Rm(e){return`[src="`+en(e)+`"]`}function zm(e){return`script[async]`+e}function Bm(e,t,n){if(t.count++,t.instance===null)switch(t.type){case`style`:var r=e.querySelector(`style[data-href~="`+en(n.href)+`"]`);if(r)return t.instance=r,Pt(r),r;var a=D({},n,{"data-href":n.href,"data-precedence":n.precedence,href:null,precedence:null});return r=(e.ownerDocument||e).createElement(`style`),Pt(r),np(r,`style`,a),Vm(r,n.precedence,e),t.instance=r;case`stylesheet`:a=Pm(n.href);var o=e.querySelector(Fm(a));if(o)return t.state.loading|=4,t.instance=o,Pt(o),o;r=Im(n),(a=vm.get(a))&&Hm(r,a),o=(e.ownerDocument||e).createElement(`link`),Pt(o);var s=o;return s._p=new Promise(function(e,t){s.onload=e,s.onerror=t}),np(o,`link`,r),t.state.loading|=4,Vm(o,n.precedence,e),t.instance=o;case`script`:return o=Rm(n.src),(a=e.querySelector(zm(o)))?(t.instance=a,Pt(a),a):(r=n,(a=vm.get(o))&&(r=D({},n),Um(r,a)),e=e.ownerDocument||e,a=e.createElement(`script`),Pt(a),np(a,`link`,r),e.head.appendChild(a),t.instance=a);case`void`:return null;default:throw Error(i(443,t.type))}else t.type===`stylesheet`&&!(t.state.loading&4)&&(r=t.instance,t.state.loading|=4,Vm(r,n.precedence,e));return t.instance}function Vm(e,t,n){for(var r=n.querySelectorAll(`link[rel="stylesheet"][data-precedence],style[data-precedence]`),i=r.length?r[r.length-1]:null,a=i,o=0;o<r.length;o++){var s=r[o];if(s.dataset.precedence===t)a=s;else if(a!==i)break}a?a.parentNode.insertBefore(e,a.nextSibling):(t=n.nodeType===9?n.head:n,t.insertBefore(e,t.firstChild))}function Hm(e,t){e.crossOrigin??=t.crossOrigin,e.referrerPolicy??=t.referrerPolicy,e.title??=t.title}function Um(e,t){e.crossOrigin??=t.crossOrigin,e.referrerPolicy??=t.referrerPolicy,e.integrity??=t.integrity}var Wm=null;function Gm(e,t,n){if(Wm===null){var r=new Map,i=Wm=new Map;i.set(n,r)}else i=Wm,r=i.get(n),r||(r=new Map,i.set(n,r));if(r.has(e))return r;for(r.set(e,null),n=n.getElementsByTagName(e),i=0;i<n.length;i++){var a=n[i];if(!(a[Dt]||a[bt]||e===`link`&&a.getAttribute(`rel`)===`stylesheet`)&&a.namespaceURI!==`http://www.w3.org/2000/svg`){var o=a.getAttribute(t)||``;o=e+o;var s=r.get(o);s?s.push(a):r.set(o,[a])}}return r}function Km(e,t,n){e=e.ownerDocument||e,e.head.insertBefore(n,t===`title`?e.querySelector(`head > title`):null)}function qm(e,t,n){if(n===1||t.itemProp!=null)return!1;switch(e){case`meta`:case`title`:return!0;case`style`:if(typeof t.precedence!=`string`||typeof t.href!=`string`||t.href===``)break;return!0;case`link`:if(typeof t.rel!=`string`||typeof t.href!=`string`||t.href===``||t.onLoad||t.onError)break;switch(t.rel){case`stylesheet`:return e=t.disabled,typeof t.precedence==`string`&&e==null;default:return!0}case`script`:if(t.async&&typeof t.async!=`function`&&typeof t.async!=`symbol`&&!t.onLoad&&!t.onError&&t.src&&typeof t.src==`string`)return!0}return!1}function Jm(e,t){return e===`img`&&t.src!=null&&t.src!==``&&t.onLoad==null&&t.loading!==`lazy`}function Ym(e){return!(e.type===`stylesheet`&&!(e.state.loading&3))}function Xm(e){return(e.width||100)*(e.height||100)*(typeof devicePixelRatio==`number`?devicePixelRatio:1)*.25}function Zm(e,t){typeof t.decode==`function`&&(e.imgCount++,t.complete||(e.imgBytes+=Xm(t),e.suspenseyImages.push(t)),e=rh.bind(e),t.decode().then(e,e))}function Qm(e,t,n,r){if(n.type===`stylesheet`&&(typeof r.media!=`string`||!1!==matchMedia(r.media).matches)&&!(n.state.loading&4)){if(n.instance===null){var i=Pm(r.href),a=t.querySelector(Fm(i));if(a){t=a._p,typeof t==`object`&&t&&typeof t.then==`function`&&(e.count++,e=nh.bind(e),t.then(e,e)),n.state.loading|=4,n.instance=a,Pt(a);return}a=t.ownerDocument||t,r=Im(r),(i=vm.get(i))&&Hm(r,i),a=a.createElement(`link`),Pt(a);var o=a;o._p=new Promise(function(e,t){o.onload=e,o.onerror=t}),np(a,`link`,r),n.instance=a}e.stylesheets===null&&(e.stylesheets=new Map),e.stylesheets.set(n,t),(t=n.state.preload)&&!(n.state.loading&3)&&(e.count++,n=nh.bind(e),t.addEventListener(`load`,n),t.addEventListener(`error`,n))}}var $m=0;function eh(e,t){return e.stylesheets&&e.count===0&&ah(e,e.stylesheets),0<e.count||0<e.imgCount?function(n){var r=setTimeout(function(){if(e.stylesheets&&ah(e,e.stylesheets),e.unsuspend){var t=e.unsuspend;e.unsuspend=null,t()}},6e4+t);0<e.imgBytes&&$m===0&&($m=62500*op());var i=setTimeout(function(){if(e.waitingForImages=!1,e.count===0&&(e.stylesheets&&ah(e,e.stylesheets),e.unsuspend)){var t=e.unsuspend;e.unsuspend=null,t()}},(e.imgBytes>$m?50:800)+t);return e.unsuspend=n,function(){e.unsuspend=null,clearTimeout(r),clearTimeout(i)}}:null}function th(e){if(e.count===0&&(e.imgCount===0||!e.waitingForImages)){if(e.stylesheets)ah(e,e.stylesheets);else if(e.unsuspend){var t=e.unsuspend;e.unsuspend=null,t()}}}function nh(){this.count--,th(this)}function rh(){this.imgCount--,th(this)}var ih=null;function ah(e,t){e.stylesheets=null,e.unsuspend!==null&&(e.count++,ih=new Map,t.forEach(oh,e),ih=null,nh.call(e))}function oh(e,t){if(!(t.state.loading&4)){var n=ih.get(e);if(n)var r=n.get(null);else{n=new Map,ih.set(e,n);for(var i=e.querySelectorAll(`link[data-precedence],style[data-precedence]`),a=0;a<i.length;a++){var o=i[a];(o.nodeName===`LINK`||o.getAttribute(`media`)!==`not all`)&&(n.set(o.dataset.precedence,o),r=o)}r&&n.set(null,r)}i=t.instance,o=i.getAttribute(`data-precedence`),a=n.get(o)||r,a===r&&n.set(null,i),n.set(o,i),this.count++,r=nh.bind(this),i.addEventListener(`load`,r),i.addEventListener(`error`,r),a?a.parentNode.insertBefore(i,a.nextSibling):(e=e.nodeType===9?e.head:e,e.insertBefore(i,e.firstChild)),t.state.loading|=4}}var sh={$$typeof:F,Provider:null,Consumer:null,_currentValue:pe,_currentValue2:pe,_threadCount:0};function ch(e,t,n,r,i,a,o,s,c){this.tag=1,this.containerInfo=e,this.pingCache=this.current=this.pendingChildren=null,this.timeoutHandle=-1,this.callbackNode=this.next=this.pendingContext=this.context=this.cancelPendingCommit=null,this.callbackPriority=0,this.expirationTimes=lt(-1),this.entangledLanes=this.shellSuspendCounter=this.errorRecoveryDisabledLanes=this.expiredLanes=this.warmLanes=this.pingedLanes=this.suspendedLanes=this.pendingLanes=0,this.entanglements=lt(0),this.hiddenUpdates=lt(null),this.identifierPrefix=r,this.onUncaughtError=i,this.onCaughtError=a,this.onRecoverableError=o,this.pooledCache=null,this.pooledCacheLanes=0,this.formState=c,this.transitionTypes=null,this.incompleteTransitions=new Map}function lh(e,t,n,r,i,a,o,s,c,l,u,d){return e=new ch(e,t,n,o,c,l,u,d,s),t=1,!0===a&&(t|=24),a=ki(3,null,null,t),e.current=a,a.stateNode=e,t=ka(),t.refCount++,e.pooledCache=t,t.refCount++,a.memoizedState={element:r,isDehydrated:n,cache:t},fo(a),e}function uh(e){return e?(e=Di,e):Di}function dh(e,t,n,r,i,a){i=uh(i),r.context===null?r.context=i:r.pendingContext=i,r=mo(t),r.payload={element:n},a=a===void 0?null:a,a!==null&&(r.callback=a),n=ho(e,r,t),n!==null&&(Pd(n,e,t),go(n,e,t))}function fh(e,t){if(e=e.memoizedState,e!==null&&e.dehydrated!==null){var n=e.retryLane;e.retryLane=n!==0&&n<t?n:t}}function ph(e,t){fh(e,t),(e=e.alternate)&&fh(e,t)}function mh(e){if(e.tag===13||e.tag===31){var t=wi(e,67108864);t!==null&&Pd(t,e,67108864),ph(e,67108864)}}function hh(e){if(e.tag===13||e.tag===31){var t=jd();t=ht(t);var n=wi(e,t);n!==null&&Pd(n,e,t),ph(e,t)}}var gh=!0;function _h(e,t,n,r){var i=R.T;R.T=null;var a=z.p;try{z.p=2,yh(e,t,n,r)}finally{z.p=a,R.T=i}}function vh(e,t,n,r){var i=R.T;R.T=null;var a=z.p;try{z.p=8,yh(e,t,n,r)}finally{z.p=a,R.T=i}}function yh(e,t,n,r){if(gh){var i=bh(r);if(i===null)Kf(e,t,r,xh,n),Mh(e,r);else if(Ph(i,e,t,n,r))r.stopPropagation();else if(Mh(e,r),t&4&&-1<jh.indexOf(e)){for(;i!==null;){var a=jt(i);if(a!==null)switch(a.tag){case 3:if(a=a.stateNode,a.current.memoizedState.isDehydrated){var o=rt(a.pendingLanes);if(o!==0){var s=a;for(s.pendingLanes|=2,s.entangledLanes|=2;o;){var c=1<<31-Xe(o);s.entanglements[1]|=c,o&=~c}Ef(a),!(q&6)&&(gd=Re()+500,Df(0,!1))}}break;case 31:case 13:s=wi(a,2),s!==null&&Pd(s,a,2),zd(),ph(a,2)}if(a=bh(r),a===null&&Kf(e,t,r,xh,n),a===i)break;i=a}i!==null&&r.stopPropagation()}else Kf(e,t,r,null,n)}}function bh(e){return e=vn(e),Sh(e)}var xh=null;function Sh(e){if(xh=null,e=At(e),e!==null){var t=o(e);if(t===null)e=null;else{var n=t.tag;if(n===13){if(e=s(t),e!==null)return e;e=null}else if(n===31){if(e=c(t),e!==null)return e;e=null}else if(n===3){if(t.stateNode.current.memoizedState.isDehydrated)return t.tag===3?t.stateNode.containerInfo:null;e=null}else t!==e&&(e=null)}}return xh=e,null}function Ch(e){switch(e){case`beforetoggle`:case`cancel`:case`click`:case`close`:case`contextmenu`:case`copy`:case`cut`:case`auxclick`:case`dblclick`:case`dragend`:case`dragstart`:case`drop`:case`focusin`:case`focusout`:case`input`:case`invalid`:case`keydown`:case`keypress`:case`keyup`:case`mousedown`:case`mouseup`:case`paste`:case`pause`:case`play`:case`pointercancel`:case`pointerdown`:case`pointerup`:case`ratechange`:case`reset`:case`seeked`:case`submit`:case`toggle`:case`touchcancel`:case`touchend`:case`touchstart`:case`volumechange`:case`change`:case`selectionchange`:case`textInput`:case`compositionstart`:case`compositionend`:case`compositionupdate`:case`beforeblur`:case`afterblur`:case`beforeinput`:case`blur`:case`fullscreenchange`:case`fullscreenerror`:case`focus`:case`hashchange`:case`popstate`:case`select`:case`selectstart`:return 2;case`drag`:case`dragenter`:case`dragexit`:case`dragleave`:case`dragover`:case`mousemove`:case`mouseout`:case`mouseover`:case`pointermove`:case`pointerout`:case`pointerover`:case`resize`:case`scroll`:case`touchmove`:case`wheel`:case`mouseenter`:case`mouseleave`:case`pointerenter`:case`pointerleave`:return 8;case`message`:switch(ze()){case Be:return 2;case Ve:return 8;case He:case Ue:return 32;case We:return 268435456;default:return 32}default:return 32}}var wh=!1,Th=null,Eh=null,Dh=null,Oh=new Map,kh=new Map,Ah=[],jh=`mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput copy cut paste click change contextmenu reset`.split(` `);function Mh(e,t){switch(e){case`focusin`:case`focusout`:Th=null;break;case`dragenter`:case`dragleave`:Eh=null;break;case`mouseover`:case`mouseout`:Dh=null;break;case`pointerover`:case`pointerout`:Oh.delete(t.pointerId);break;case`gotpointercapture`:case`lostpointercapture`:kh.delete(t.pointerId)}}function Nh(e,t,n,r,i,a){return e===null||e.nativeEvent!==a?(e={blockedOn:t,domEventName:n,eventSystemFlags:r,nativeEvent:a,targetContainers:[i]},t!==null&&(t=jt(t),t!==null&&mh(t)),e):(e.eventSystemFlags|=r,t=e.targetContainers,i!==null&&t.indexOf(i)===-1&&t.push(i),e)}function Ph(e,t,n,r,i){switch(t){case`focusin`:return Th=Nh(Th,e,t,n,r,i),!0;case`dragenter`:return Eh=Nh(Eh,e,t,n,r,i),!0;case`mouseover`:return Dh=Nh(Dh,e,t,n,r,i),!0;case`pointerover`:var a=i.pointerId;return Oh.set(a,Nh(Oh.get(a)||null,e,t,n,r,i)),!0;case`gotpointercapture`:return a=i.pointerId,kh.set(a,Nh(kh.get(a)||null,e,t,n,r,i)),!0}return!1}function Fh(e){var t=At(e.target);if(t!==null){var n=o(t);if(n!==null){if(t=n.tag,t===13){if(t=s(n),t!==null){e.blockedOn=t,vt(e.priority,function(){hh(n)});return}}else if(t===31){if(t=c(n),t!==null){e.blockedOn=t,vt(e.priority,function(){hh(n)});return}}else if(t===3&&n.stateNode.current.memoizedState.isDehydrated){e.blockedOn=n.tag===3?n.stateNode.containerInfo:null;return}}}e.blockedOn=null}function Ih(e){if(e.blockedOn!==null)return!1;for(var t=e.targetContainers;0<t.length;){var n=bh(e.nativeEvent);if(n===null){n=e.nativeEvent;var r=new n.constructor(n.type,n);_n=r,n.target.dispatchEvent(r),_n=null}else return t=jt(n),t!==null&&mh(t),e.blockedOn=n,!1;t.shift()}return!0}function Lh(e,t,n){Ih(e)&&n.delete(t)}function Rh(){wh=!1,Th!==null&&Ih(Th)&&(Th=null),Eh!==null&&Ih(Eh)&&(Eh=null),Dh!==null&&Ih(Dh)&&(Dh=null),Oh.forEach(Lh),kh.forEach(Lh)}function zh(e,n){e.blockedOn===n&&(e.blockedOn=null,wh||(wh=!0,t.unstable_scheduleCallback(t.unstable_NormalPriority,Rh)))}var Bh=null;function Vh(e){Bh!==e&&(Bh=e,t.unstable_scheduleCallback(t.unstable_NormalPriority,function(){Bh===e&&(Bh=null);for(var t=0;t<e.length;t+=3){var n=e[t],r=e[t+1],i=e[t+2];if(typeof r!=`function`){if(Sh(r||n)===null)continue;break}var a=jt(n);a!==null&&(e.splice(t,3),t-=3,Qs(a,{pending:!0,data:i,method:n.method,action:r},r,i))}}))}function Hh(e){function t(t){return zh(t,e)}Th!==null&&zh(Th,e),Eh!==null&&zh(Eh,e),Dh!==null&&zh(Dh,e),Oh.forEach(t),kh.forEach(t);for(var n=0;n<Ah.length;n++){var r=Ah[n];r.blockedOn===e&&(r.blockedOn=null)}for(;0<Ah.length&&(n=Ah[0],n.blockedOn===null);)Fh(n),n.blockedOn===null&&Ah.shift();if(n=(e.ownerDocument||e).$$reactFormReplay,n!=null)for(r=0;r<n.length;r+=3){var i=n[r],a=n[r+1],o=i[xt]||null;if(typeof a==`function`)o||Vh(n);else if(o){var s=null;if(a&&a.hasAttribute(`formAction`)){if(i=a,o=a[xt]||null)s=o.formAction;else if(Sh(i)!==null)continue}else s=o.action;typeof s==`function`?n[r+1]=s:(n.splice(r,3),r-=3),Vh(n)}}}function Uh(){function e(e){e.canIntercept&&e.info===`react-transition`&&e.intercept({handler:function(){return new Promise(function(e){return i=e})},focusReset:`manual`,scroll:`manual`})}function t(){i!==null&&(i(),i=null),r||setTimeout(n,20)}function n(){if(!r&&!navigation.transition){var e=navigation.currentEntry;e&&e.url!=null&&navigation.navigate(e.url,{state:e.getState(),info:`react-transition`,history:`replace`})}}if(typeof navigation==`object`){var r=!1,i=null;return navigation.addEventListener(`navigate`,e),navigation.addEventListener(`navigatesuccess`,t),navigation.addEventListener(`navigateerror`,t),setTimeout(n,100),function(){r=!0,navigation.removeEventListener(`navigate`,e),navigation.removeEventListener(`navigatesuccess`,t),navigation.removeEventListener(`navigateerror`,t),i!==null&&(i(),i=null)}}}function Wh(e){this._internalRoot=e}Gh.prototype.render=Wh.prototype.render=function(e){var t=this._internalRoot;if(t===null)throw Error(i(409));var n=t.current;dh(n,jd(),e,t,null,null)},Gh.prototype.unmount=Wh.prototype.unmount=function(){var e=this._internalRoot;if(e!==null){this._internalRoot=null;var t=e.containerInfo;dh(e.current,2,null,e,null,null),zd(),t[St]=null}};function Gh(e){this._internalRoot=e}Gh.prototype.unstable_scheduleHydration=function(e){if(e){var t=_t();e={blockedOn:null,target:e,priority:t};for(var n=0;n<Ah.length&&t!==0&&t<Ah[n].priority;n++);Ah.splice(n,0,e),n===0&&Fh(e)}};var Kh=n.version;if(Kh!==`19.3.1`)throw Error(i(527,Kh,`19.3.1`));z.findDOMNode=function(e){var t=e._reactInternals;if(t===void 0)throw typeof e.render==`function`?Error(i(188)):(e=Object.keys(e).join(`,`),Error(i(268,e)));return e=d(t),e=e===null?null:p(e),e=e===null?null:e.stateNode,e};var qh={bundleType:0,version:`19.3.1`,rendererPackageName:`react-dom`,currentDispatcherRef:R,reconcilerVersion:`19.3.1`};if(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__<`u`){var Jh=__REACT_DEVTOOLS_GLOBAL_HOOK__;if(!Jh.isDisabled&&Jh.supportsFiber)try{qe=Jh.inject(qh),Je=Jh}catch{}}e.createRoot=function(e,t){if(!a(e))throw Error(i(299));var n=!1,r=``,o=xc,s=Sc,c=Cc;return t!=null&&(!0===t.unstable_strictMode&&(n=!0),t.identifierPrefix!==void 0&&(r=t.identifierPrefix),t.onUncaughtError!==void 0&&(o=t.onUncaughtError),t.onCaughtError!==void 0&&(s=t.onCaughtError),t.onRecoverableError!==void 0&&(c=t.onRecoverableError)),t=lh(e,1,!1,null,null,n,r,null,o,s,c,Uh),e[St]=t.current,Wf(e),new Wh(t)}})),g=o(((e,t)=>{function n(){if(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__<`u`&&typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE==`function`)try{__REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(n)}catch(e){console.error(e)}}n(),t.exports=h()})),_=c(u(),1),v=g(),y=o((e=>{var t=u().__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;e.c=function(e){return t.H.useMemoCache(e)}})),b=o(((e,t)=>{t.exports=y()})),x=/^(?:[a-z][a-z0-9+.-]*:|[\\/]{2})/i,S=/^[\\/]{2}/;function C(e,t){return t+e.replace(/\\/g,`/`)}var w=`popstate`;function T(e){return typeof e==`object`&&!!e&&`pathname`in e&&`search`in e&&`hash`in e&&`state`in e&&`key`in e}function E(e={}){function t(e,t){let n=t.state?.masked,{pathname:r,search:i,hash:a}=n||e.location;return j(``,{pathname:r,search:i,hash:a},t.state&&t.state.usr||null,t.state&&t.state.key||`default`,n?{pathname:e.location.pathname,search:e.location.search,hash:e.location.hash}:void 0)}function n(e,t){return typeof t==`string`?t:M(t)}return P(t,n,null,e)}function D(e,t){if(e===!1||e==null)throw Error(t)}function O(e,t){if(!e){typeof console<`u`&&console.warn(t);try{throw Error(t)}catch{}}}function k(){return Math.random().toString(36).substring(2,10)}function A(e,t){return{usr:e.state,key:e.key,idx:t,masked:e.mask?{pathname:e.pathname,search:e.search,hash:e.hash}:void 0}}function j(e,t,n=null,r,i){return{pathname:typeof e==`string`?e:e.pathname,search:``,hash:``,...typeof t==`string`?N(t):t,state:n,key:t&&t.key||r||k(),mask:i}}function M({pathname:e=`/`,search:t=``,hash:n=``}){return t&&t!==`?`&&(e+=t.charAt(0)===`?`?t:`?`+t),n&&n!==`#`&&(e+=n.charAt(0)===`#`?n:`#`+n),e}function N(e){let t={};if(e){let n=e.indexOf(`#`);n>=0&&(t.hash=e.substring(n),e=e.substring(0,n));let r=e.indexOf(`?`);r>=0&&(t.search=e.substring(r),e=e.substring(0,r)),e&&(t.pathname=e)}return t}function P(e,t,n,r={}){let{window:i=document.defaultView,v5Compat:a=!1}=r,o=i.history,s=`POP`,c=null,l=u();l??(l=0,o.replaceState({...o.state,idx:l},``));function u(){return(o.state||{idx:null}).idx}function d(){s=`POP`;let e=u(),t=e==null?null:e-l;l=e,c&&c({action:s,location:h.location,delta:t})}function f(e,t){s=`PUSH`;let r=T(e)?e:j(h.location,e,t);n&&n(r,e),l=u()+1;let d=A(r,l),f=h.createHref(r.mask||r);try{o.pushState(d,``,f)}catch(e){if(e instanceof DOMException&&e.name===`DataCloneError`)throw e;i.location.assign(f)}a&&c&&c({action:s,location:h.location,delta:1})}function p(e,t){s=`REPLACE`;let r=T(e)?e:j(h.location,e,t);n&&n(r,e),l=u();let i=A(r,l),d=h.createHref(r.mask||r);o.replaceState(i,``,d),a&&c&&c({action:s,location:h.location,delta:0})}function m(e){return F(i,e)}let h={get action(){return s},get location(){return e(i,o)},listen(e){if(c)throw Error(`A history only accepts one active listener`);return i.addEventListener(w,d),c=e,()=>{i.removeEventListener(w,d),c=null}},createHref(e){return t(i,e)},createURL:m,encodeLocation(e){let t=m(e);return{pathname:t.pathname,search:t.search,hash:t.hash}},push:f,replace:p,go(e){return o.go(e)}};return h}function F(e,t,n=!1){let r=`http://localhost`;e&&(r=e.location.origin===`null`?e.location.href:e.location.origin),D(r,`No window.location.(origin|href) available to create URL`);let i=typeof t==`string`?t:M(t);return i=i.replace(/ $/,`%20`),!n&&S.test(i)&&(i=r+i),new URL(i,r)}function I(e,t,n=`/`){return L(e,t,n,!1)}function L(e,t,n,r,i){let a=ge((typeof t==`string`?N(t):t).pathname||`/`,n);if(a==null)return null;let o=i??ee(e),s=null,c=he(a);for(let e=0;s==null&&e<o.length;++e)s=R(o[e],c,r);return s}function ee(e){let t=te(e);return re(t),t}function te(e,t=[],n=[],r=``,i=!1){let a=(e,a,o=i,s)=>{let c={relativePath:s===void 0?e.path||``:s,caseSensitive:e.caseSensitive===!0,childrenIndex:a,route:e};if(c.relativePath.startsWith(`/`)){if(!c.relativePath.startsWith(r)&&o)return;D(c.relativePath.startsWith(r),`Absolute route path "${c.relativePath}" nested under path "${r}" is not valid. An absolute child route path must start with the combined path of all its parent routes.`),c.relativePath=c.relativePath.slice(r.length)}let l=Ce([r,c.relativePath]),u=n.concat(c);e.children&&e.children.length>0&&(D(e.index!==!0,`Index routes must not have child routes. Please remove all child routes from route path "${l}".`),te(e.children,t,u,l,o)),(e.path!=null||e.index)&&t.push({path:l,score:de(l,e.index),routesMeta:u.map((e,t)=>{let[n,r]=me(e.relativePath,e.caseSensitive,t===u.length-1);return{...e,matcher:n,compiledParams:r}})})};return e.forEach((e,t)=>{if(e.path===``||!e.path?.includes(`?`))a(e,t);else for(let n of ne(e.path))a(e,t,!0,n)}),t}function ne(e){let t=e.split(`/`);if(t.length===0)return[];let[n,...r]=t,i=n.endsWith(`?`),a=n.replace(/\?$/,``);if(r.length===0)return i?[a,``]:[a];let o=ne(r.join(`/`)),s=[];return s.push(...o.map(e=>e===``?a:[a,e].join(`/`))),i&&s.push(...o),s.map(t=>e.startsWith(`/`)&&t===``?`/`:t)}function re(e){e.sort((e,t)=>e.score===t.score?fe(e.routesMeta.map(e=>e.childrenIndex),t.routesMeta.map(e=>e.childrenIndex)):t.score-e.score)}var ie=/^:[\w-]+$/,ae=3,oe=2,se=1,ce=10,le=-2,ue=e=>e===`*`;function de(e,t){let n=e.split(`/`),r=n.length;return n.some(ue)&&(r+=le),t&&(r+=oe),n.filter(e=>!ue(e)).reduce((e,t)=>e+(ie.test(t)?ae:t===``?se:ce),r)}function fe(e,t){return e.length===t.length&&e.slice(0,-1).every((e,n)=>e===t[n])?e[e.length-1]-t[t.length-1]:0}function R(e,t,n=!1){let{routesMeta:r}=e,i={},a=`/`,o=[];for(let e=0;e<r.length;++e){let s=r[e],c=e===r.length-1,l=a===`/`?t:t.slice(a.length)||`/`,u={path:s.relativePath,caseSensitive:s.caseSensitive,end:c},d=s.matcher&&s.compiledParams?pe(u,l,s.matcher,s.compiledParams):z(u,l),f=s.route;if(!d&&c&&n&&!r[r.length-1].route.index&&(d=z({path:s.relativePath,caseSensitive:s.caseSensitive,end:!1},l)),!d)return null;Object.assign(i,d.params),o.push({params:i,pathname:Ce([a,d.pathname]),pathnameBase:Te(Ce([a,d.pathnameBase])),route:f}),d.pathnameBase!==`/`&&(a=Ce([a,d.pathnameBase]))}return o}function z(e,t){typeof e==`string`&&(e={path:e,caseSensitive:!1,end:!0});let[n,r]=me(e.path,e.caseSensitive,e.end);return pe(e,t,n,r)}function pe(e,t,n,r){let i=t.match(n);if(!i)return null;let a=i[0],o=we(a,1),s=i.slice(1);return{params:r.reduce((e,{paramName:t,isOptional:n},r)=>{if(t===`*`){let e=s[r]||``;o=we(a.slice(0,a.length-e.length),1)}let i=s[r];return e[t]=n&&!i?void 0:(i||``).replace(/%2F/g,`/`),e},{}),pathname:a,pathnameBase:o,pattern:e}}function me(e,t=!1,n=!0){O(e===`*`||!e.endsWith(`*`)||e.endsWith(`/*`),`Route path "${e}" will be treated as if it were "${e.replace(/\*$/,`/*`)}" because the \`*\` character must always follow a \`/\` in the pattern. To get rid of this warning, please change the route path to "${e.replace(/\*$/,`/*`)}".`);let r=[],i=`^`+e.replace(/\/*\*?$/,``).replace(/^\/*/,`/`).replace(/[\\.*+^${}|()[\]]/g,`\\$&`).replace(/\/:([\w-]+)(\?)?/g,(e,t,n,i,a)=>{if(r.push({paramName:t,isOptional:n!=null}),n){let t=a.charAt(i+e.length);return t&&t!==`/`?`/([^\\/]*)`:`(?:/([^\\/]*))?`}return`/([^\\/]+)`}).replace(/\/([\w-]+)\?(\/|$)/g,`(/$1)?$2`);return e.endsWith(`*`)?(r.push({paramName:`*`}),i+=e===`*`||e===`/*`?`(.*)$`:`(?:\\/(.+)|\\/*)$`):n?i+=`\\/*$`:e!==``&&e!==`/`&&(i+=`(?:(?=\\/|$))`),[new RegExp(i,t?void 0:`i`),r]}function he(e){try{return e.split(`/`).map(e=>decodeURIComponent(e).replace(/\//g,`%2F`)).join(`/`)}catch(t){return O(!1,`The URL path "${e}" could not be decoded because it is a malformed URL segment. This is probably due to a bad percent encoding (${t}).`),e}}function ge(e,t){if(t===`/`)return e;if(!e.toLowerCase().startsWith(t.toLowerCase()))return null;let n=t.endsWith(`/`)?t.length-1:t.length,r=e.charAt(n);return r&&r!==`/`?null:e.slice(n)||`/`}function _e(e,t=`/`){let{pathname:n,search:r=``,hash:i=``}=typeof e==`string`?N(e):e,a;return n?(n=Se(n),a=n.startsWith(`/`)||n.startsWith(`\\`)?B(n.substring(1),`/`):B(n,t)):a=t,{pathname:a,search:Ee(r),hash:De(i)}}function B(e,t){let n=we(t).split(`/`);return e.split(`/`).forEach(e=>{e===`..`?n.length>1&&n.pop():e!==`.`&&n.push(e)}),n.length>1?n.join(`/`):`/`}function ve(e,t,n,r){return`Cannot include a '${e}' character in a manually specified \`to.${t}\` field [${JSON.stringify(r)}].  Please separate it out to the \`to.${n}\` field. Alternatively you may provide the full path as a string in <Link to="..."> and the router will parse it for you.`}function ye(e){return e.filter((e,t)=>t===0||e.route.path&&e.route.path.length>0)}function be(e){let t=ye(e);return t.map((e,n)=>n===t.length-1?e.pathname:e.pathnameBase)}function xe(e,t,n,r=!1){let i;typeof e==`string`?i=N(e):(i={...e},D(!i.pathname||!i.pathname.includes(`?`),ve(`?`,`pathname`,`search`,i)),D(!i.pathname||!i.pathname.includes(`#`),ve(`#`,`pathname`,`hash`,i)),D(!i.search||!i.search.includes(`#`),ve(`#`,`search`,`hash`,i)));let a=e===``||i.pathname===``,o=a?`/`:i.pathname,s;if(o==null)s=n;else{let e=t.length-1;if(!r&&o.startsWith(`..`)){let t=o.split(`/`);for(;t[0]===`..`;)t.shift(),--e;i.pathname=t.join(`/`)}s=e>=0?t[e]:`/`}let c=_e(i,s),l=o&&o!==`/`&&o.endsWith(`/`),u=(a||o===`.`)&&n.endsWith(`/`);return!c.pathname.endsWith(`/`)&&(l||u)&&(c.pathname+=`/`),c}var Se=e=>e.replace(/[\\/]{2,}/g,`/`),Ce=e=>Se(e.join(`/`));function we(e,t=0){let n=e.length;for(;n>t&&e.charCodeAt(n-1)===47;)n--;return n===e.length?e:e.slice(0,n)}var Te=e=>we(e).replace(/^\/*/,`/`),Ee=e=>!e||e===`?`?``:e.startsWith(`?`)?e:`?`+e,De=e=>!e||e===`#`?``:e.startsWith(`#`)?e:`#`+e,Oe=class{constructor(e,t,n,r=!1){this.status=e,this.statusText=t||``,this.internal=r,n instanceof Error?(this.data=n.toString(),this.error=n):this.data=n}};function ke(e){return e!=null&&typeof e.status==`number`&&typeof e.statusText==`string`&&typeof e.internal==`boolean`&&`data`in e}function Ae(e){return Ce(e.map(e=>e.route.path).filter(Boolean))||`/`}var je=typeof window<`u`&&window.document!==void 0&&window.document.createElement!==void 0;function Me(e,t){let n=e;if(typeof n!=`string`||!x.test(n))return{absoluteURL:void 0,isExternal:!1,to:n};let r=n,i=!1;if(je)try{let e=new URL(window.location.href),r=S.test(n)?new URL(C(n,e.protocol)):new URL(n),a=ge(r.pathname,t);r.origin===e.origin&&a!=null?n=a+r.search+r.hash:i=!0}catch{O(!1,`<Link to="${n}"> contains an invalid URL which will probably break when clicked - please update to a valid URL path.`)}return{absoluteURL:r,isExternal:i,to:n}}Object.getOwnPropertyNames(Object.prototype).sort().join(`\0`);var Ne=new URL(`http://localhost`);function Pe(e){if(e.createURL)return e.createURL(`/`);try{return new URL(e.createHref(`/`),Ne)}catch{return Ne}}function Fe(e,t){return e.origin===t.origin&&(e.origin!==`null`||e.protocol===t.protocol&&e.host===t.host)}function Ie(e,t){if(e.startsWith(`//`))return!0;let n=t.protocol.toLowerCase();return e.toLowerCase().startsWith(n)?t.host===``||e.slice(n.length).startsWith(`//`):!1}function Le(e,t,n,r){let i=null;try{i=e==null?null:new URL(e,n)}catch{}let a=new URL(t,n),o=i!=null&&!Fe(i,n),s=!Fe(a,n);if(r===`reject`){if(o||s)throw Error(`External navigation is not allowed`)}else if(s&&(i==null||!Ie(e,i)||!Fe(i,a)))throw Error(`External navigation is not allowed`)}var Re=[`POST`,`PUT`,`PATCH`,`DELETE`];new Set(Re);var ze=[`GET`,...Re];new Set(ze);var Be=[`about:`,`blob:`,`chrome:`,`chrome-untrusted:`,`content:`,`data:`,`devtools:`,`file:`,`filesystem:`,`javascript:`];function Ve(e){try{return Be.includes(new URL(e).protocol)}catch{return!1}}var He=_.createContext(null);He.displayName=`DataRouter`;var Ue=_.createContext(null);Ue.displayName=`DataRouterState`;var We=_.createContext(!1);function Ge(){return _.useContext(We)}var Ke=_.createContext({isTransitioning:!1});Ke.displayName=`ViewTransition`;var qe=_.createContext(new Map);qe.displayName=`Fetchers`;var Je=_.createContext(null);Je.displayName=`Await`;var Ye=_.createContext(null);Ye.displayName=`Navigation`;var Xe=_.createContext(null);Xe.displayName=`Location`;var Ze=_.createContext({outlet:null,matches:[],isDataRoute:!1});Ze.displayName=`Route`;var Qe=_.createContext(null);Qe.displayName=`RouteError`;var $e=`REACT_ROUTER_ERROR`,et=`REDIRECT`,tt=`ROUTE_ERROR_RESPONSE`;function nt(e){if(e.startsWith(`${$e}:${et}:{`))try{let t=JSON.parse(e.slice(28));if(typeof t==`object`&&t&&typeof t.status==`number`&&typeof t.statusText==`string`&&typeof t.location==`string`&&typeof t.reloadDocument==`boolean`&&typeof t.replace==`boolean`)return t}catch{}}function rt(e){if(e.startsWith(`${$e}:${tt}:{`))try{let t=JSON.parse(e.slice(40));if(typeof t==`object`&&t&&typeof t.status==`number`&&typeof t.statusText==`string`)return new Oe(t.status,t.statusText,t.data)}catch{}}function it(e,{relative:t}={}){D(at(),`useHref() may be used only in the context of a <Router> component.`);let{basename:n,navigator:r}=_.useContext(Ye),{hash:i,pathname:a,search:o}=dt(e,{relative:t}),s=a;return n!==`/`&&(s=a===`/`?n:Ce([n,a])),r.createHref({pathname:s,search:o,hash:i})}function at(){return _.useContext(Xe)!=null}function ot(){return D(at(),`useLocation() may be used only in the context of a <Router> component.`),_.useContext(Xe).location}var st=`You should call navigate() in a React.useEffect(), not when your component is first rendered.`;function ct(e){_.useContext(Ye).static||_.useLayoutEffect(e)}function lt(){let{isDataRoute:e}=_.useContext(Ze);return e?Ot():ut()}function ut(){D(at(),`useNavigate() may be used only in the context of a <Router> component.`);let e=_.useContext(He),{basename:t,navigator:n}=_.useContext(Ye),{matches:r}=_.useContext(Ze),{pathname:i}=ot(),a=JSON.stringify(be(r)),o=_.useRef(!1);return ct(()=>{o.current=!0}),_.useCallback((r,s={})=>{if(O(o.current,st),!o.current)return;if(typeof r==`number`){n.go(r);return}let c=xe(r,JSON.parse(a),i,s.relative===`path`);e==null&&t!==`/`&&(c.pathname=c.pathname===`/`?t:Ce([t,c.pathname])),Le(typeof r==`string`?r:M(r),n.createHref(c),Pe(n),`reject`),(s.replace?n.replace:n.push)(c,s.state,s)},[t,n,a,i,e])}_.createContext(null);function dt(e,{relative:t}={}){let{matches:n}=_.useContext(Ze),{pathname:r}=ot(),i=JSON.stringify(be(n));return _.useMemo(()=>xe(e,JSON.parse(i),r,t===`path`),[e,i,r,t])}function ft(e,t){return pt(e,t)}function pt(e,t,n){D(at(),`useRoutes() may be used only in the context of a <Router> component.`);let{navigator:r}=_.useContext(Ye),{matches:i}=_.useContext(Ze),a=i[i.length-1],o=a?a.params:{},s=a?a.pathname:`/`,c=a?a.pathnameBase:`/`,l=a&&a.route;{let e=l&&l.path||``;At(s,!l||e.endsWith(`*`)||e.endsWith(`*?`),`You rendered descendant <Routes> (or called \`useRoutes()\`) at "${s}" (under <Route path="${e}">) but the parent route path has no trailing "*". This means if you navigate deeper, the parent won't match anymore and therefore the child routes will never render.

Please change the parent <Route path="${e}"> to <Route path="${e===`/`?`*`:`${e}/*`}">.`)}let u=ot(),d;if(t){let e=typeof t==`string`?N(t):t;D(c===`/`||e.pathname?.startsWith(c),`When overriding the location using \`<Routes location>\` or \`useRoutes(routes, location)\`, the location pathname must begin with the portion of the URL pathname that was matched by all parent routes. The current pathname base is "${c}" but pathname "${e.pathname}" was given in the \`location\` prop.`),d=e}else d=u;let f=d.pathname||`/`,p=f;if(c!==`/`){let e=c.replace(/^\//,``).split(`/`);p=`/`+f.replace(/^\//,``).split(`/`).slice(e.length).join(`/`)}let m=n&&n.state.matches.length?n.state.matches.map(e=>Object.assign(e,{route:n.manifest[e.route.id]||e.route})):I(e,{pathname:p});O(l||m!=null,`No routes matched location "${d.pathname}${d.search}${d.hash}" `),O(m==null||m[m.length-1].route.element!==void 0||m[m.length-1].route.Component!==void 0||m[m.length-1].route.lazy!==void 0,`Matched leaf route at location "${d.pathname}${d.search}${d.hash}" does not have an element or Component. This means it will render an <Outlet /> with a null value by default resulting in an "empty" page.`);let h=bt(m&&m.map(e=>Object.assign({},e,{params:Object.assign({},o,e.params),pathname:Ce([c,r.encodeLocation?r.encodeLocation(e.pathname.replace(/%/g,`%25`).replace(/\?/g,`%3F`).replace(/#/g,`%23`)).pathname:e.pathname]),pathnameBase:e.pathnameBase===`/`?c:Ce([c,r.encodeLocation?r.encodeLocation(e.pathnameBase.replace(/%/g,`%25`).replace(/\?/g,`%3F`).replace(/#/g,`%23`)).pathname:e.pathnameBase])})),i,n);return t&&h?_.createElement(Xe.Provider,{value:{location:{pathname:`/`,search:``,hash:``,state:null,key:`default`,mask:void 0,...d},navigationType:`POP`}},h):h}function mt(){let e=Dt(),t=ke(e)?`${e.status} ${e.statusText}`:e instanceof Error?e.message:JSON.stringify(e),n=e instanceof Error?e.stack:null,r=`rgba(200,200,200, 0.5)`,i={padding:`0.5rem`,backgroundColor:r},a={padding:`2px 4px`,backgroundColor:r},o=null;return console.error(`Error handled by React Router default ErrorBoundary:`,e),o=_.createElement(_.Fragment,null,_.createElement(`p`,null,`💿 Hey developer 👋`),_.createElement(`p`,null,`You can provide a way better UX than this when your app throws errors by providing your own `,_.createElement(`code`,{style:a},`ErrorBoundary`),` or`,` `,_.createElement(`code`,{style:a},`errorElement`),` prop on your route.`)),_.createElement(_.Fragment,null,_.createElement(`h2`,null,`Unexpected Application Error!`),_.createElement(`h3`,{style:{fontStyle:`italic`}},t),n?_.createElement(`pre`,{style:i},n):null,o)}var ht=_.createElement(mt,null),gt=class extends _.Component{constructor(e){super(e),this.state={location:e.location,revalidation:e.revalidation,error:e.error}}static getDerivedStateFromError(e){return{error:e}}static getDerivedStateFromProps(e,t){return t.location!==e.location||t.revalidation!==`idle`&&e.revalidation===`idle`?{error:e.error,location:e.location,revalidation:e.revalidation}:{error:e.error===void 0?t.error:e.error,location:t.location,revalidation:e.revalidation||t.revalidation}}componentDidCatch(e,t){this.props.onError?this.props.onError(e,t):console.error(`React Router caught the following error during render`,e)}render(){let e=this.state.error;if(this.context&&typeof e==`object`&&e&&`digest`in e&&typeof e.digest==`string`){let t=rt(e.digest);t&&(e=t)}let t=e===void 0?this.props.children:_.createElement(Ze.Provider,{value:this.props.routeContext},_.createElement(Qe.Provider,{value:e,children:this.props.component}));return this.context?_.createElement(vt,{error:e},t):t}};gt.contextType=We;var _t=new WeakMap;function vt({children:e,error:t}){let{basename:n,navigator:r}=_.useContext(Ye);if(typeof t==`object`&&t&&`digest`in t&&typeof t.digest==`string`){let e=nt(t.digest);if(e){let i=_t.get(t);if(i)throw i;let a=Me(e.location,n),o=a.absoluteURL||a.to;if(Le(e.location,o,Pe(r),`allow-explicit`),Ve(o))throw Error(`Invalid redirect location`);if(je&&!_t.get(t)){if(a.isExternal||e.reloadDocument)window.location.href=o;else{let n=Promise.resolve().then(()=>window.__reactRouterDataRouter.navigate(a.to,{replace:e.replace}));throw _t.set(t,n),n}}return _.createElement(`meta`,{httpEquiv:`refresh`,content:`0;url=${o}`})}}return e}function yt({routeContext:e,match:t,children:n}){let r=_.useContext(He);return r&&r.static&&r.staticContext&&(t.route.errorElement||t.route.ErrorBoundary)&&(r.staticContext._deepestRenderedBoundaryId=t.route.id),_.createElement(Ze.Provider,{value:e},n)}function bt(e,t=[],n){let r=n?.state;if(e==null){if(!r)return null;if(r.errors)e=r.matches;else if(t.length===0&&!r.initialized&&r.matches.length>0)e=r.matches;else return null}let i=e,a=r?.errors;if(a!=null){let e=i.findIndex(e=>e.route.id&&a?.[e.route.id]!==void 0);D(e>=0,`Could not find a matching route for errors on route IDs: ${Object.keys(a).join(`,`)}`),i=i.slice(0,Math.min(i.length,e+1))}let o=!1,s=-1;if(n&&r){o=r.renderFallback;for(let e=0;e<i.length;e++){let t=i[e];if((t.route.HydrateFallback||t.route.hydrateFallbackElement)&&(s=e),t.route.id){let{loaderData:e,errors:a}=r,c=t.route.loader&&!e.hasOwnProperty(t.route.id)&&(!a||a[t.route.id]===void 0);if(t.route.lazy||c){n.isStatic&&(o=!0),i=s>=0?i.slice(0,s+1):[i[0]];break}}}}let c=n?.onError,l=r&&c?(e,t)=>{c(e,{location:r.location,params:r.matches?.[0]?.params??{},pattern:Ae(r.matches),errorInfo:t})}:void 0;return i.reduceRight((e,n,c)=>{let u,d=!1,f=null,p=null;r&&(u=a&&n.route.id?a[n.route.id]:void 0,f=n.route.errorElement||ht,o&&(s<0&&c===0?(At(`route-fallback`,!1,"No `HydrateFallback` element provided to render during initial hydration"),d=!0,p=null):s===c&&(d=!0,p=n.route.hydrateFallbackElement||null)));let m=t.concat(i.slice(0,c+1)),h=()=>{let t;return t=u?f:d?p:n.route.Component?_.createElement(n.route.Component,null):n.route.element?n.route.element:e,_.createElement(yt,{match:n,routeContext:{outlet:e,matches:m,isDataRoute:r!=null},children:t})};return r&&(n.route.ErrorBoundary||n.route.errorElement||c===0)?_.createElement(gt,{location:r.location,revalidation:r.revalidation,component:f,error:u,children:h(),routeContext:{outlet:null,matches:m,isDataRoute:!0},onError:l}):h()},null)}function xt(e){return`${e} must be used within a data router.  See https://reactrouter.com/en/main/routers/picking-a-router.`}function St(e){let t=_.useContext(He);return D(t,xt(e)),t}function Ct(e){let t=_.useContext(Ue);return D(t,xt(e)),t}function wt(e){let t=_.useContext(Ze);return D(t,xt(e)),t}function Tt(e){let t=wt(e),n=t.matches[t.matches.length-1];return D(n.route.id,`${e} can only be used on routes that contain a unique "id"`),n.route.id}function Et(){return Tt(`useRouteId`)}function Dt(){let e=_.useContext(Qe),t=Ct(`useRouteError`),n=Tt(`useRouteError`);return e===void 0?t.errors?.[n]:e}function Ot(){let{router:e}=St(`useNavigate`),t=Tt(`useNavigate`),n=_.useRef(!1);return ct(()=>{n.current=!0}),_.useCallback(async(r,i={})=>{O(n.current,st),n.current&&(typeof r==`number`?await e.navigate(r):await e.navigate(r,{fromRouteId:t,...i}))},[e,t])}var kt={};function At(e,t,n){!t&&!kt[e]&&(kt[e]=!0,O(!1,n))}_.memo(jt);function jt({routes:e,manifest:t,future:n,state:r,isStatic:i,onError:a}){return pt(e,void 0,{manifest:t,state:r,isStatic:i,onError:a,future:n})}function Mt({to:e,replace:t,state:n,relative:r}){D(at(),`<Navigate> may be used only in the context of a <Router> component.`);let{static:i,navigator:a}=_.useContext(Ye);O(!i,`<Navigate> must not be used on the initial render in a <StaticRouter>. This is a no-op, but you should modify your code so the <Navigate> is only ever rendered in response to some user interaction or state change.`);let{matches:o}=_.useContext(Ze),{pathname:s}=ot(),c=lt(),l=xe(e,be(o),s,r===`path`);Le(typeof e==`string`?e:M(e),a.createHref(l),Pe(a),`reject`);let u=JSON.stringify(l);return _.useEffect(()=>{c(JSON.parse(u),{replace:t,state:n,relative:r})},[c,u,r,t,n]),null}function Nt(e){D(!1,`A <Route> is only ever to be used as the child of <Routes> element, never rendered directly. Please wrap your <Route> in a <Routes>.`)}function Pt({basename:e=`/`,children:t=null,location:n,navigationType:r=`POP`,navigator:i,static:a=!1,useTransitions:o}){D(!at(),`You cannot render a <Router> inside another <Router>. You should never have more than one in your app.`);let s=e.replace(/^\/*/,`/`),c=_.useMemo(()=>({basename:s,navigator:i,static:a,useTransitions:o,future:{}}),[s,i,a,o]);typeof n==`string`&&(n=N(n));let{pathname:l=`/`,search:u=``,hash:d=``,state:f=null,key:p=`default`,mask:m}=n,h=_.useMemo(()=>{let e=ge(l,s);return e==null?null:{location:{pathname:e,search:u,hash:d,state:f,key:p,mask:m},navigationType:r}},[s,l,u,d,f,p,r,m]);return O(h!=null,`<Router basename="${s}"> is not able to match the URL "${l}${u}${d}" because it does not start with the basename, so the <Router> won't render anything.`),h==null?null:_.createElement(Ye.Provider,{value:c},_.createElement(Xe.Provider,{children:t,value:h}))}function Ft({children:e,location:t}){return ft(It(e),t)}_.Component;function It(e,t=[]){let n=[];return _.Children.forEach(e,(e,r)=>{if(!_.isValidElement(e))return;let i=[...t,r];if(e.type===_.Fragment){n.push.apply(n,It(e.props.children,i));return}D(e.type===Nt,`[${typeof e.type==`string`?e.type:e.type.name}] is not a <Route> component. All component children of <Routes> must be a <Route> or <React.Fragment>`),D(!e.props.index||!e.props.children,`An index route cannot have child routes.`);let a={id:e.props.id||i.join(`-`),caseSensitive:e.props.caseSensitive,element:e.props.element,Component:e.props.Component,index:e.props.index,path:e.props.path,middleware:e.props.middleware,loader:e.props.loader,action:e.props.action,hydrateFallbackElement:e.props.hydrateFallbackElement,HydrateFallback:e.props.HydrateFallback,errorElement:e.props.errorElement,ErrorBoundary:e.props.ErrorBoundary,hasErrorBoundary:e.props.hasErrorBoundary===!0||e.props.ErrorBoundary!=null||e.props.errorElement!=null,shouldRevalidate:e.props.shouldRevalidate,handle:e.props.handle,lazy:e.props.lazy};e.props.children&&(a.children=It(e.props.children,i)),n.push(a)}),n}var Lt=`get`,Rt=`application/x-www-form-urlencoded`;function zt(e){return typeof HTMLElement<`u`&&e instanceof HTMLElement}function Bt(e){return zt(e)&&e.tagName.toLowerCase()===`button`}function Vt(e){return zt(e)&&e.tagName.toLowerCase()===`form`}function Ht(e){return zt(e)&&e.tagName.toLowerCase()===`input`}function Ut(e){return!!(e.metaKey||e.altKey||e.ctrlKey||e.shiftKey)}function V(e,t){return e.button===0&&(!t||t===`_self`)&&!Ut(e)}function Wt(e=``){return new URLSearchParams(typeof e==`string`||Array.isArray(e)||e instanceof URLSearchParams?e:Object.keys(e).reduce((t,n)=>{let r=e[n];return t.concat(Array.isArray(r)?r.map(e=>[n,e]):[[n,r]])},[]))}function Gt(e,t){let n=Wt(e);return t&&t.forEach((e,r)=>{n.has(r)||t.getAll(r).forEach(e=>{n.append(r,e)})}),n}var Kt=null;function qt(){if(Kt===null)try{new FormData(document.createElement(`form`),0),Kt=!1}catch{Kt=!0}return Kt}var Jt=new Set([`application/x-www-form-urlencoded`,`multipart/form-data`,`text/plain`]);function Yt(e){return e!=null&&!Jt.has(e)?(O(!1,`"${e}" is not a valid \`encType\` for \`<Form>\`/\`<fetcher.Form>\` and will default to "${Rt}"`),null):e}function Xt(e,t){let n,r,i,a,o;if(Vt(e)){let o=e.getAttribute(`action`);r=o?ge(o,t):null,n=e.getAttribute(`method`)||Lt,i=Yt(e.getAttribute(`enctype`))||Rt,a=new FormData(e)}else if(Bt(e)||Ht(e)&&(e.type===`submit`||e.type===`image`)){let o=e.form;if(o==null)throw Error(`Cannot submit a <button> or <input type="submit"> without a <form>`);let s=e.getAttribute(`formaction`)||o.getAttribute(`action`);if(r=s?ge(s,t):null,n=e.getAttribute(`formmethod`)||o.getAttribute(`method`)||Lt,i=Yt(e.getAttribute(`formenctype`))||Yt(o.getAttribute(`enctype`))||Rt,a=new FormData(o,e),!qt()){let{name:t,type:n,value:r}=e;if(n===`image`){let e=t?`${t}.`:``;a.append(`${e}x`,`0`),a.append(`${e}y`,`0`)}else t&&a.append(t,r)}}else if(zt(e))throw Error(`Cannot submit element that is not <form>, <button>, or <input type="submit|image">`);else n=Lt,r=null,i=Rt,o=e;return a&&i===`text/plain`&&(o=a,a=void 0),{action:r,method:n.toLowerCase(),encType:i,formData:a,body:o}}Object.getOwnPropertyNames(Object.prototype).sort().join(`\0`);function Zt(e,t){if(e===!1||e==null)throw Error(t)}function Qt(e,t,n,r){let i=typeof e==`string`?new URL(e,typeof window>`u`?`server://singlefetch/`:window.location.origin):e;return i.pathname=n?i.pathname.endsWith(`/`)?`${i.pathname}_.${r}`:`${i.pathname}.${r}`:i.pathname===`/`?`_root.${r}`:t&&ge(i.pathname,t)===`/`?`${we(t)}/_root.${r}`:`${we(i.pathname)}.${r}`,i}async function $t(e,t){if(e.id in t)return t[e.id];try{let n=await import(e.module);return t[e.id]=n,n}catch(t){return console.error(`Error loading route module \`${e.module}\`, reloading page...`),console.error(t),window.__reactRouterContext&&window.__reactRouterContext.isSpaMode,window.location.reload(),new Promise(()=>{})}}function en(e){return e!=null&&typeof e.page==`string`}function tn(e){return e==null?!1:e.href==null?e.rel===`preload`&&typeof e.imageSrcSet==`string`&&typeof e.imageSizes==`string`:typeof e.rel==`string`&&typeof e.href==`string`}async function nn(e,t,n){return cn((await Promise.all(e.map(async e=>{let r=t.routes[e.route.id];if(r){let e=await $t(r,n);return e.links?e.links():[]}return[]}))).flat(1).filter(tn).filter(e=>e.rel===`stylesheet`||e.rel===`preload`).map(e=>e.rel===`stylesheet`?{...e,rel:`prefetch`,as:`style`}:{...e,rel:`prefetch`}))}function rn(e,t,n,r,i,a){let o=(e,t)=>!n[t]||e.route.id!==n[t].route.id,s=(e,t)=>n[t].pathname!==e.pathname||n[t].route.path?.endsWith(`*`)&&n[t].params[`*`]!==e.params[`*`];return a===`assets`?t.filter((e,t)=>o(e,t)||s(e,t)):a===`data`?t.filter((t,a)=>{let c=r.routes[t.route.id];if(!c||!c.hasLoader)return!1;if(o(t,a)||s(t,a))return!0;if(t.route.shouldRevalidate){let r=t.route.shouldRevalidate({currentUrl:new URL(i.pathname+i.search+i.hash,window.origin),currentParams:n[0]?.params||{},nextUrl:new URL(e,window.origin),nextParams:t.params,defaultShouldRevalidate:!0});if(typeof r==`boolean`)return r}return!0}):[]}function an(e,t,{includeHydrateFallback:n}={}){return on(e.map(e=>{let r=t.routes[e.route.id];if(!r)return[];let i=[r.module];return r.clientActionModule&&(i=i.concat(r.clientActionModule)),r.clientLoaderModule&&(i=i.concat(r.clientLoaderModule)),n&&r.hydrateFallbackModule&&(i=i.concat(r.hydrateFallbackModule)),r.imports&&(i=i.concat(r.imports)),i}).flat(1))}function on(e){return[...new Set(e)]}function sn(e){let t={},n=Object.keys(e).sort();for(let r of n)t[r]=e[r];return t}function cn(e,t){let n=new Set,r=new Set(t);return e.reduce((e,i)=>{if(t&&!en(i)&&i.as===`script`&&i.href&&r.has(i.href))return e;let a=JSON.stringify(sn(i));return n.has(a)||(n.add(a),e.push({key:a,link:i})),e},[])}function ln(){let e=_.useContext(He);return Zt(e,`You must render this element inside a <DataRouterContext.Provider> element`),e}function un(){let e=_.useContext(Ue);return Zt(e,`You must render this element inside a <DataRouterStateContext.Provider> element`),e}var dn=_.createContext(void 0);dn.displayName=`FrameworkContext`;function fn(){let e=_.useContext(dn);return Zt(e,`You must render this element inside a <HydratedRouter> element`),e}function pn(e,t){let n=_.useContext(dn),[r,i]=_.useState(!1),[a,o]=_.useState(!1),{onFocus:s,onBlur:c,onMouseEnter:l,onMouseLeave:u,onTouchStart:d}=t,f=_.useRef(null);_.useEffect(()=>{if(e===`render`&&o(!0),e===`viewport`){let e=new IntersectionObserver(e=>{e.forEach(e=>{o(e.isIntersecting)})},{threshold:.5});return f.current&&e.observe(f.current),()=>{e.disconnect()}}},[e]),_.useEffect(()=>{if(r){let e=setTimeout(()=>{o(!0)},100);return()=>{clearTimeout(e)}}},[r]);let p=()=>{i(!0)},m=()=>{i(!1),o(!1)};return n?e===`intent`?[a,f,{onFocus:mn(s,p),onBlur:mn(c,m),onMouseEnter:mn(l,p),onMouseLeave:mn(u,m),onTouchStart:mn(d,p)}]:[a,f,{}]:[!1,f,{}]}function mn(e,t){return n=>{e&&e(n),n.defaultPrevented||t(n)}}function hn({page:e,...t}){let n=Ge(),{nonce:r}=fn(),{router:i}=ln(),a=_.useMemo(()=>I(i.routes,e,i.basename),[i.routes,e,i.basename]);return a?(t.nonce==null&&r&&(t={...t,nonce:r}),n?_.createElement(_n,{page:e,matches:a,...t}):_.createElement(vn,{page:e,matches:a,...t})):null}function gn(e){let{manifest:t,routeModules:n}=fn(),[r,i]=_.useState([]);return _.useEffect(()=>{let r=!1;return nn(e,t,n).then(e=>{r||i(e)}),()=>{r=!0}},[e,t,n]),r}function _n({page:e,matches:t,...n}){let r=ot(),{future:i}=fn(),{basename:a}=ln(),o=_.useMemo(()=>{if(e===r.pathname+r.search+r.hash)return[];let n=Qt(e,a,i.v8_trailingSlashAwareDataRequests,`rsc`),o=!1,s=[];for(let e of t)typeof e.route.shouldRevalidate==`function`?o=!0:s.push(e.route.id);return o&&s.length>0&&n.searchParams.set(`_routes`,s.join(`,`)),[n.pathname+n.search]},[a,i.v8_trailingSlashAwareDataRequests,e,r,t]);return _.createElement(_.Fragment,null,o.map(e=>_.createElement(`link`,{key:e,rel:`prefetch`,as:`fetch`,href:e,...n})))}function vn({page:e,matches:t,...n}){let r=ot(),{future:i,manifest:a,routeModules:o}=fn(),{basename:s}=ln(),{loaderData:c,matches:l}=un(),u=_.useMemo(()=>rn(e,t,l,a,r,`data`),[e,t,l,a,r]),d=_.useMemo(()=>rn(e,t,l,a,r,`assets`),[e,t,l,a,r]),f=_.useMemo(()=>{if(e===r.pathname+r.search+r.hash)return[];let n=new Set,l=!1;if(t.forEach(e=>{let t=a.routes[e.route.id];t&&t.hasLoader&&(!u.some(t=>t.route.id===e.route.id)&&e.route.id in c&&o[e.route.id]?.shouldRevalidate||t.hasClientLoader?l=!0:n.add(e.route.id))}),n.size===0)return[];let d=Qt(e,s,i.v8_trailingSlashAwareDataRequests,`data`);return l&&n.size>0&&d.searchParams.set(`_routes`,t.filter(e=>n.has(e.route.id)).map(e=>e.route.id).join(`,`)),[d.pathname+d.search]},[s,i.v8_trailingSlashAwareDataRequests,c,r,a,u,t,e,o]),p=_.useMemo(()=>an(d,a),[d,a]),m=gn(d);return _.createElement(_.Fragment,null,f.map(e=>_.createElement(`link`,{key:e,rel:`prefetch`,as:`fetch`,href:e,...n})),p.map(e=>_.createElement(`link`,{key:e,rel:`modulepreload`,href:e,...n})),m.map(({key:e,link:t})=>_.createElement(`link`,{key:e,nonce:n.nonce,...t,crossOrigin:t.crossOrigin??n.crossOrigin})))}function yn(...e){return t=>{e.forEach(e=>{typeof e==`function`?e(t):e!=null&&(e.current=t)})}}_.Component;var bn=typeof window<`u`&&window.document!==void 0&&window.document.createElement!==void 0;try{bn&&(window.__reactRouterVersion=`7.18.4`)}catch{}function xn({basename:e,children:t,useTransitions:n,window:r}){let i=_.useRef();i.current??=E({window:r,v5Compat:!0});let a=i.current,[o,s]=_.useState({action:a.action,location:a.location}),c=_.useCallback(e=>{n===!1?s(e):_.startTransition(()=>s(e))},[n]);return _.useLayoutEffect(()=>a.listen(c),[a,c]),_.createElement(Pt,{basename:e,children:t,location:o.location,navigationType:o.action,navigator:a,useTransitions:n})}var Sn=_.forwardRef(function({onClick:e,discover:t=`render`,prefetch:n=`none`,relative:r,reloadDocument:i,replace:a,mask:o,state:s,target:c,to:l,preventScrollReset:u,viewTransition:d,defaultShouldRevalidate:f,...p},m){let{basename:h,navigator:g,useTransitions:v}=_.useContext(Ye),y=typeof l==`string`&&x.test(l),b=Me(l,h);l=b.to;let S=it(l,{relative:r}),C=ot(),w=null;if(o){let e=xe(o,[],C.mask?C.mask.pathname:`/`,!0);h!==`/`&&(e.pathname=e.pathname===`/`?h:Ce([h,e.pathname])),w=g.createHref(e)}let[T,E,D]=pn(n,p),O=Dn(l,{replace:a,mask:o,state:s,target:c,preventScrollReset:u,relative:r,viewTransition:d,defaultShouldRevalidate:f,useTransitions:v});function k(t){e&&e(t),t.defaultPrevented||O(t)}let A=!(b.isExternal||i),j=_.createElement(`a`,{...p,...D,href:(A?w:void 0)||b.absoluteURL||S,onClick:A?k:e,ref:yn(m,E),target:c,"data-discover":!y&&t===`render`?`true`:void 0});return T&&!y?_.createElement(_.Fragment,null,j,_.createElement(hn,{page:S})):j});Sn.displayName=`Link`;var Cn=_.forwardRef(function({"aria-current":e=`page`,caseSensitive:t=!1,className:n=``,end:r=!1,style:i,to:a,viewTransition:o,children:s,...c},l){let u=dt(a,{relative:c.relative}),d=ot(),f=_.useContext(Ue),{navigator:p,basename:m}=_.useContext(Ye),h=f!=null&&Nn(u)&&o===!0,g=p.encodeLocation?p.encodeLocation(u).pathname:u.pathname,v=d.pathname,y=f&&f.navigation&&f.navigation.location?f.navigation.location.pathname:null;t||(v=v.toLowerCase(),y=y?y.toLowerCase():null,g=g.toLowerCase()),y&&m&&(y=ge(y,m)||y);let b=g!==`/`&&g.endsWith(`/`)?g.length-1:g.length,x=v===g||!r&&v.startsWith(g)&&v.charAt(b)===`/`,S=y!=null&&(y===g||!r&&y.startsWith(g)&&y.charAt(g.length)===`/`),C={isActive:x,isPending:S,isTransitioning:h},w=x?e:void 0,T;T=typeof n==`function`?n(C):[n,x?`active`:null,S?`pending`:null,h?`transitioning`:null].filter(Boolean).join(` `);let E=typeof i==`function`?i(C):i;return _.createElement(Sn,{...c,"aria-current":w,className:T,ref:l,style:E,to:a,viewTransition:o},typeof s==`function`?s(C):s)});Cn.displayName=`NavLink`;var wn=_.forwardRef(({discover:e=`render`,fetcherKey:t,navigate:n,reloadDocument:r,replace:i,state:a,method:o=Lt,action:s,onSubmit:c,relative:l,preventScrollReset:u,viewTransition:d,defaultShouldRevalidate:f,...p},m)=>{let{useTransitions:h}=_.useContext(Ye),g=jn(),v=Mn(s,{relative:l}),y=o.toLowerCase()===`get`?`get`:`post`,b=typeof s==`string`&&x.test(s);return _.createElement(`form`,{ref:m,method:y,action:v,onSubmit:r?c:e=>{if(c&&c(e),e.defaultPrevented)return;e.preventDefault();let r=e.nativeEvent.submitter,s=r?.getAttribute(`formmethod`)||o,p=()=>g(r||e.currentTarget,{fetcherKey:t,method:s,navigate:n,replace:i,state:a,relative:l,preventScrollReset:u,viewTransition:d,defaultShouldRevalidate:f});h&&n!==!1?_.startTransition(()=>p()):p()},...p,"data-discover":!b&&e===`render`?`true`:void 0})});wn.displayName=`Form`;function Tn(e){return`${e} must be used within a data router.  See https://reactrouter.com/en/main/routers/picking-a-router.`}function En(e){let t=_.useContext(He);return D(t,Tn(e)),t}function Dn(e,{target:t,replace:n,mask:r,state:i,preventScrollReset:a,relative:o,viewTransition:s,defaultShouldRevalidate:c,useTransitions:l}={}){let u=lt(),d=ot(),f=dt(e,{relative:o});return _.useCallback(p=>{if(V(p,t)){p.preventDefault();let t=n===void 0?M(d)===M(f):n,m=()=>u(e,{replace:t,mask:r,state:i,preventScrollReset:a,relative:o,viewTransition:s,defaultShouldRevalidate:c});l?_.startTransition(()=>m()):m()}},[d,u,f,n,r,i,t,e,a,o,s,c,l])}function On(e){O(typeof URLSearchParams<`u`,"You cannot use the `useSearchParams` hook in a browser that does not support the URLSearchParams API. If you need to support Internet Explorer 11, we recommend you load a polyfill such as https://github.com/ungap/url-search-params.");let t=_.useRef(Wt(e)),n=_.useRef(!1),r=ot(),i=_.useMemo(()=>Gt(r.search,n.current?null:t.current),[r.search]),a=lt();return[i,_.useCallback((e,t)=>{let r=Wt(typeof e==`function`?e(new URLSearchParams(i)):e);n.current=!0,a(`?`+r,t)},[a,i])]}var kn=0,An=()=>`__${String(++kn)}__`;function jn(){let{router:e}=En(`useSubmit`),{basename:t}=_.useContext(Ye),n=Et(),r=e.fetch,i=e.navigate;return _.useCallback(async(e,a={})=>{let{action:o,method:s,encType:c,formData:l,body:u}=Xt(e,t);if(a.navigate===!1){let e=a.fetcherKey||An();await r(e,n,a.action||o,{defaultShouldRevalidate:a.defaultShouldRevalidate,preventScrollReset:a.preventScrollReset,formData:l,body:u,formMethod:a.method||s,formEncType:a.encType||c,flushSync:a.flushSync})}else await i(a.action||o,{defaultShouldRevalidate:a.defaultShouldRevalidate,preventScrollReset:a.preventScrollReset,formData:l,body:u,formMethod:a.method||s,formEncType:a.encType||c,replace:a.replace,state:a.state,fromRouteId:n,flushSync:a.flushSync,viewTransition:a.viewTransition})},[r,i,t,n])}function Mn(e,{relative:t}={}){let{basename:n}=_.useContext(Ye),r=_.useContext(Ze);D(r,`useFormAction must be used inside a RouteContext`);let[i]=r.matches.slice(-1),a={...dt(e||`.`,{relative:t})},o=ot();if(e==null){a.search=o.search;let e=new URLSearchParams(a.search),t=e.getAll(`index`);if(t.some(e=>e===``)){e.delete(`index`),t.filter(e=>e).forEach(t=>e.append(`index`,t));let n=e.toString();a.search=n?`?${n}`:``}}return(!e||e===`.`)&&i.route.index&&(a.search=a.search?a.search.replace(/^\?/,`?index&`):`?index`),n!==`/`&&(a.pathname=a.pathname===`/`?n:Ce([n,a.pathname])),M(a)}function Nn(e,{relative:t}={}){let n=_.useContext(Ke);D(n!=null,"`useViewTransitionState` must be used within `react-router-dom`'s `RouterProvider`.  Did you accidentally import `RouterProvider` from `react-router`?");let{basename:r}=En(`useViewTransitionState`),i=dt(e,{relative:t});if(!n.isTransitioning)return!1;let a=ge(n.currentLocation.pathname,r)||n.currentLocation.pathname,o=ge(n.nextLocation.pathname,r)||n.nextLocation.pathname;return z(i.pathname,o)!=null||z(i.pathname,a)!=null}var Pn=o((e=>{var t=Symbol.for(`react.transitional.element`),n=Symbol.for(`react.fragment`);function r(e,n,r){var i=null;if(r!==void 0&&(i=``+r),n.key!==void 0&&(i=``+n.key),`key`in n)for(var a in r={},n)a!==`key`&&(r[a]=n[a]);else r=n;return n=r.ref,{$$typeof:t,type:e,key:i,ref:n===void 0?null:n,props:r}}e.Fragment=n,e.jsx=r,e.jsxs=r})),Fn=o(((e,t)=>{t.exports=Pn()})),In=b(),H=Fn(),Ln=e=>{let t=(0,In.c)(61),{stats:n,health:r,apiError:i,onSearchSubmit:a,onReindex:o,onRetryConnection:s,isReindexing:c,isRetrying:l}=e,u=l!==void 0&&l,[d,f]=(0,_.useState)(``),p;t[0]!==a||t[1]!==d?(p=e=>{e.key===`Enter`&&d.trim()&&a(d.trim())},t[0]=a,t[1]=d,t[2]=p):p=t[2];let m=p,h=!(!r?.ok||i),g=n?.repo_name||r?.repo_name||`fastAST`,v=n?.symbols??r?.symbol_count,y=n?.files??r?.file_count,b=n?.edges??r?.edge_count,x;t[3]===Symbol.for(`react.memo_cache_sentinel`)?(x=(0,H.jsxs)(`div`,{className:`brand-title`,children:[(0,H.jsx)(`span`,{className:`material-symbols-outlined brand-icon`,children:`hub`}),(0,H.jsx)(`span`,{className:`brand-name`,children:`FastAST`}),(0,H.jsx)(`span`,{className:`brand-tag`,children:`LENS`})]}),t[3]=x):x=t[3];let S=n?.repo_path||r?.repo_path||``,C;t[4]===Symbol.for(`react.memo_cache_sentinel`)?(C=(0,H.jsx)(`span`,{className:`material-symbols-outlined text-xs text-outline`,children:`folder_code`}),t[4]=C):C=t[4];let w;t[5]===g?w=t[6]:(w=(0,H.jsx)(`span`,{className:`repo-name`,children:g}),t[5]=g,t[6]=w);let T=`status-pill ${h?`status-pill-online`:`status-pill-offline`} ${u?`opacity-70 pointer-events-none`:``}`,E=!h&&!u?s:void 0,D=h?`Connected to ${r?.db_path||`.fastast.db`}`:i||`API server unreachable on port 4200`,O=`status-dot ${h?`dot-online`:`dot-offline`}`,k;t[7]===O?k=t[8]:(k=(0,H.jsx)(`span`,{className:O}),t[7]=O,t[8]=k);let A=h?`API :4200`:u?`Connecting...`:`API Offline • Retry`,j;t[9]!==k||t[10]!==A||t[11]!==T||t[12]!==E||t[13]!==D?(j=(0,H.jsxs)(`span`,{className:T,onClick:E,title:D,children:[k,A]}),t[9]=k,t[10]=A,t[11]=T,t[12]=E,t[13]=D,t[14]=j):j=t[14];let M;t[15]!==j||t[16]!==S||t[17]!==w?(M=(0,H.jsxs)(`div`,{className:`header-left`,children:[x,(0,H.jsxs)(`div`,{className:`repo-badge`,title:S,children:[C,w,j]})]}),t[15]=j,t[16]=S,t[17]=w,t[18]=M):M=t[18];let N;t[19]===Symbol.for(`react.memo_cache_sentinel`)?(N=(0,H.jsx)(`span`,{className:`material-symbols-outlined search-icon`,children:`search`}),t[19]=N):N=t[19];let P;t[20]===Symbol.for(`react.memo_cache_sentinel`)?(P=e=>f(e.target.value),t[20]=P):P=t[20];let F;t[21]!==m||t[22]!==d?(F=(0,H.jsx)(`input`,{type:`text`,value:d,onChange:P,onKeyDown:m,placeholder:`Search symbols, files, or query evidence (Enter)...`,className:`header-search-input`}),t[21]=m,t[22]=d,t[23]=F):F=t[23];let I;t[24]===d?I=t[25]:(I=d&&(0,H.jsx)(`button`,{className:`search-clear-btn`,onClick:()=>f(``),title:`Clear search`,children:`×`}),t[24]=d,t[25]=I);let L;t[26]!==F||t[27]!==I?(L=(0,H.jsxs)(`div`,{className:`header-search-wrap`,children:[N,F,I]}),t[26]=F,t[27]=I,t[28]=L):L=t[28];let ee;t[29]!==b||t[30]!==y||t[31]!==h||t[32]!==u||t[33]!==s||t[34]!==v?(ee=h?(0,H.jsxs)(`div`,{className:`telemetry-group`,children:[(0,H.jsxs)(`div`,{className:`telemetry-pill`,title:`Indexed files in .fastast.db`,children:[(0,H.jsx)(`span`,{className:`telemetry-val`,children:y===void 0?`—`:y.toLocaleString()}),(0,H.jsx)(`span`,{className:`telemetry-lbl`,children:`files`})]}),(0,H.jsxs)(`div`,{className:`telemetry-pill`,title:`Extracted AST symbols`,children:[(0,H.jsx)(`span`,{className:`telemetry-val text-primary`,children:v===void 0?`—`:v.toLocaleString()}),(0,H.jsx)(`span`,{className:`telemetry-lbl`,children:`symbols`})]}),(0,H.jsxs)(`div`,{className:`telemetry-pill`,title:`Graph dependency edges`,children:[(0,H.jsx)(`span`,{className:`telemetry-val text-tertiary`,children:b===void 0?`—`:b.toLocaleString()}),(0,H.jsx)(`span`,{className:`telemetry-lbl`,children:`edges`})]})]}):(0,H.jsxs)(`button`,{className:`header-btn header-btn-error`,onClick:s,disabled:u,title:`Attempt to reconnect to FastAST API server`,children:[(0,H.jsx)(`span`,{className:`material-symbols-outlined text-sm ${u?`animate-spin`:``}`,children:u?`sync`:`sync_problem`}),(0,H.jsx)(`span`,{children:u?`Connecting...`:`Retry Connection`})]}),t[29]=b,t[30]=y,t[31]=h,t[32]=u,t[33]=s,t[34]=v,t[35]=ee):ee=t[35];let te=c||!h,ne=`material-symbols-outlined text-sm ${c?`spin-icon`:``}`,re;t[36]===ne?re=t[37]:(re=(0,H.jsx)(`span`,{className:ne,children:`refresh`}),t[36]=ne,t[37]=re);let ie=c?`Indexing...`:`Re-index`,ae;t[38]===ie?ae=t[39]:(ae=(0,H.jsx)(`span`,{children:ie}),t[38]=ie,t[39]=ae);let oe;t[40]!==o||t[41]!==te||t[42]!==re||t[43]!==ae?(oe=(0,H.jsxs)(`button`,{onClick:o,disabled:te,className:`header-btn header-btn-secondary`,title:`Re-run incremental AST indexing on repository`,children:[re,ae]}),t[40]=o,t[41]=te,t[42]=re,t[43]=ae,t[44]=oe):oe=t[44];let se;t[45]!==a||t[46]!==d?(se=()=>{let e=d.trim()||`retrieve_context`;a(e)},t[45]=a,t[46]=d,t[47]=se):se=t[47];let ce,le;t[48]===Symbol.for(`react.memo_cache_sentinel`)?(ce=(0,H.jsx)(`span`,{className:`material-symbols-outlined text-sm`,children:`manage_search`}),le=(0,H.jsx)(`span`,{children:`Evidence Query`}),t[48]=ce,t[49]=le):(ce=t[48],le=t[49]);let ue;t[50]===se?ue=t[51]:(ue=(0,H.jsxs)(`button`,{onClick:se,className:`header-btn header-btn-primary`,title:`Retrieve token-bounded evidence bundle`,children:[ce,le]}),t[50]=se,t[51]=ue);let de;t[52]!==ee||t[53]!==oe||t[54]!==ue?(de=(0,H.jsxs)(`div`,{className:`header-right`,children:[ee,oe,ue]}),t[52]=ee,t[53]=oe,t[54]=ue,t[55]=de):de=t[55];let fe;t[56]===Symbol.for(`react.memo_cache_sentinel`)?(fe=(0,H.jsx)(`style`,{children:`
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
      `}),t[56]=fe):fe=t[56];let R;return t[57]!==M||t[58]!==L||t[59]!==de?(R=(0,H.jsxs)(`header`,{className:`app-header`,children:[M,L,de,fe]}),t[57]=M,t[58]=L,t[59]=de,t[60]=R):R=t[60],R},Rn=e=>{let t=(0,In.c)(40),{stats:n,health:r,apiError:i}=e,a=!(!r?.ok||i),o=n?.symbols??r?.symbol_count,s=n?.files??r?.file_count,c;t[0]===n?c=t[1]:(c=n?.languages?Object.keys(n.languages).length:void 0,t[0]=n,t[1]=c);let l=c,u=n?.communities_count,d=o===void 0?void 0:String(o),f;t[2]===d?f=t[3]:(f={to:`/globe`,icon:`hub`,label:`2D Code Graph`,badge:d,sub:`Call Graph & Dependencies`},t[2]=d,t[3]=f);let p=s===void 0?void 0:String(s),m;t[4]===p?m=t[5]:(m={to:`/explore`,icon:`account_tree`,label:`Code Explorer`,badge:p,sub:`Files, Outlines & Snippets`},t[4]=p,t[5]=m);let h;t[6]===Symbol.for(`react.memo_cache_sentinel`)?(h={to:`/evidence`,icon:`manage_search`,label:`Evidence Bundle`,badge:`RRF`,sub:`Token-Bounded Retrieval`},t[6]=h):h=t[6];let g=u!==void 0&&u>0?String(u):void 0,_;t[7]===g?_=t[8]:(_={to:`/communities`,icon:`bubble_chart`,label:`Communities`,badge:g,sub:`Louvain Modularity Clusters`},t[7]=g,t[8]=_);let v=l===void 0?void 0:`${l} langs`,y;t[9]===v?y=t[10]:(y={to:`/coverage`,icon:`fact_check`,label:`Index Coverage`,badge:v,sub:`Language & File Breakdown`},t[9]=v,t[10]=y);let b;t[11]===Symbol.for(`react.memo_cache_sentinel`)?(b={to:`/architecture`,icon:`layers`,label:`Architecture`,sub:`Subsystems & Hotspots`},t[11]=b):b=t[11];let x=a?`OK`:`ERR`,S;t[12]===x?S=t[13]:(S={to:`/system`,icon:`dns`,label:`System & Health`,badge:x,sub:`API, SQLite WAL & Doctor`},t[12]=x,t[13]=S);let C;t[14]!==y||t[15]!==S||t[16]!==f||t[17]!==m||t[18]!==_?(C=[f,m,h,_,y,b,S],t[14]=y,t[15]=S,t[16]=f,t[17]=m,t[18]=_,t[19]=C):C=t[19];let w=C,T;t[20]===Symbol.for(`react.memo_cache_sentinel`)?(T=(0,H.jsx)(`div`,{className:`sidebar-heading`,children:`Navigation`}),t[20]=T):T=t[20];let E;t[21]===w?E=t[22]:(E=(0,H.jsxs)(`div`,{className:`sidebar-section`,children:[T,(0,H.jsx)(`nav`,{className:`sidebar-nav`,children:w.map(Bn)})]}),t[21]=w,t[22]=E);let D=`conn-dot ${a?`conn-dot-ok`:`conn-dot-err`}`,O;t[23]===D?O=t[24]:(O=(0,H.jsx)(`span`,{className:D}),t[23]=D,t[24]=O);let k=a?`FastAST API Connected`:`API Unreachable`,A;t[25]===k?A=t[26]:(A=(0,H.jsx)(`span`,{className:`conn-title`,children:k}),t[25]=k,t[26]=A);let j;t[27]!==O||t[28]!==A?(j=(0,H.jsxs)(`div`,{className:`conn-row`,children:[O,A]}),t[27]=O,t[28]=A,t[29]=j):j=t[29];let M;t[30]===Symbol.for(`react.memo_cache_sentinel`)?(M=(0,H.jsx)(`div`,{children:`Endpoint: 127.0.0.1:4200`}),t[30]=M):M=t[30];let N=r?.db_exists?`.fastast.db (WAL)`:`Not initialized`,P;t[31]===N?P=t[32]:(P=(0,H.jsxs)(`div`,{className:`conn-meta font-code`,children:[M,(0,H.jsxs)(`div`,{children:[`DB: `,N]})]}),t[31]=N,t[32]=P);let F;t[33]!==j||t[34]!==P?(F=(0,H.jsx)(`div`,{className:`sidebar-footer`,children:(0,H.jsxs)(`div`,{className:`conn-card`,children:[j,P]})}),t[33]=j,t[34]=P,t[35]=F):F=t[35];let I;t[36]===Symbol.for(`react.memo_cache_sentinel`)?(I=(0,H.jsx)(`style`,{children:`
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
        }
        .sidebar-section {
          display: flex;
          flex-direction: column;
          gap: 6px;
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
      `}),t[36]=I):I=t[36];let L;return t[37]!==E||t[38]!==F?(L=(0,H.jsxs)(`aside`,{className:`app-sidebar`,children:[E,F,I]}),t[37]=E,t[38]=F,t[39]=L):L=t[39],L};function zn(e){let{isActive:t}=e;return`sidebar-link ${t?`sidebar-link-active`:``}`}function Bn(e){return(0,H.jsxs)(Cn,{to:e.to,className:zn,children:[(0,H.jsx)(`span`,{className:`material-symbols-outlined sidebar-icon`,children:e.icon}),(0,H.jsxs)(`div`,{className:`sidebar-link-text`,children:[(0,H.jsxs)(`div`,{className:`sidebar-link-row`,children:[(0,H.jsx)(`span`,{className:`sidebar-label`,children:e.label}),e.badge&&(0,H.jsx)(`span`,{className:`sidebar-badge ${e.badge===`ERR`?`sidebar-badge-err`:``}`,children:e.badge})]}),(0,H.jsx)(`span`,{className:`sidebar-sub`,children:e.sub})]})]},e.to)}var Vn=`/api`,Hn=`http://127.0.0.1:4200/api`,Un=1e4,Wn=class extends Error{status;endpoint;constructor(e,t,n){super(e),this.name=`ApiConnectionError`,this.endpoint=t,this.status=n}};async function Gn(e,t){let n=new AbortController,r=setTimeout(()=>n.abort(),Un);try{let r=null,i=null;try{if(r=await fetch(`${Vn}${e}`,{...t,signal:n.signal}),!r.ok&&(r.status===502||r.status===504||r.status===500))try{let i=await fetch(`${Hn}${e}`,{...t,signal:n.signal});i.ok&&(r=i)}catch{}}catch(a){i=a;try{r=await fetch(`${Hn}${e}`,{...t,signal:n.signal})}catch{throw i}}if(!r||!r.ok){let t=r?.status,n=t?`HTTP ${t} on ${e}`:`Failed request on ${e}`;try{let e=await r?.json();e?.error&&(n=e.error)}catch{}throw new Wn(n,e,t)}return await r.json()}catch(t){throw t instanceof Wn?t:t?.name===`AbortError`?new Wn(`Request timed out after ${Un/1e3}s (${e}). Ensure FastAST API server is running on port 4200.`,e):new Wn(`Cannot reach FastAST API server at http://127.0.0.1:4200 (${e}). Start it with "fastast serve" or "./start_ui.sh".`,e)}finally{clearTimeout(r)}}var Kn={async getHealth(){return await Gn(`/health`)},async getStats(){return await Gn(`/stats`)},async getFiles(){return(await Gn(`/files`)).files||[]},async searchSymbols(e,t,n,r=60){let i=new URLSearchParams({q:e,limit:String(r)});return t&&t!==`all`&&i.set(`kind`,t),n&&n!==`all`&&i.set(`language`,n),(await Gn(`/symbols?${i}`)).symbols||[]},async getOutline(e){return(await Gn(`/outline?${new URLSearchParams({file:e})}`)).outline||[]},async getSnippet(e,t,n,r){let i=new URLSearchParams;return e&&i.set(`symbol`,e),t&&i.set(`file`,t),n!==void 0&&i.set(`start`,String(n)),r!==void 0&&i.set(`end`,String(r)),await Gn(`/snippet?${i}`)},async getCallGraph(e){return await Gn(`/calls?${new URLSearchParams({symbol:e})}`)},async getGraphNeighborhood(e,t=2){return await Gn(`/graph?${new URLSearchParams({symbol:e,depth:String(t)})}`)},async getEvidence(e,t=1500,n=`hybrid`){return await Gn(`/evidence?${new URLSearchParams({q:e,max_tokens:String(t),ranking:n})}`)},async getCommunities(e=25){return(await Gn(`/communities?limit=${e}`)).communities||[]},async getSimilarSymbols(e,t=10){return(await Gn(`/similar?${new URLSearchParams({symbol:e,limit:String(t)})}`)).similar||[]},async getGlobeTopology(e){let t=new URLSearchParams;return t.set(`mode`,e?.mode||`full`),e?.symbol&&t.set(`symbol`,e.symbol),t.set(`depth`,String(e?.depth??2)),t.set(`max_nodes`,String(e?.maxNodes??240)),t.set(`max_edges`,String(e?.maxEdges??800)),await Gn(`/globe?${t}`)},async getDiagnostics(){return await Gn(`/diagnose`)},async triggerReindex(e=!1){return await Gn(`/index`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify({force:e})})}},qn=()=>{let e=(0,In.c)(48),t=lt(),[n,r]=(0,_.useState)(null),i;e[0]===Symbol.for(`react.memo_cache_sentinel`)?(i=[],e[0]=i):i=e[0];let[a,o]=(0,_.useState)(i),s;e[1]===Symbol.for(`react.memo_cache_sentinel`)?(s=[],e[1]=s):s=e[1];let[c,l]=(0,_.useState)(s),[u,d]=(0,_.useState)(null),f,p;e[2]===Symbol.for(`react.memo_cache_sentinel`)?(f=()=>{Promise.all([Kn.getStats(),Kn.getCommunities(12),Kn.getGlobeTopology({mode:`neighborhood`,depth:1})]).then(e=>{let[t,n,i]=e;r(t),o(n),l(i.hub_symbols||[])}).catch(e=>{d(e?.message||`Failed to load live architecture data.`)})},p=[],e[2]=f,e[3]=p):(f=e[2],p=e[3]),(0,_.useEffect)(f,p);let m;e[4]===Symbol.for(`react.memo_cache_sentinel`)?(m=[{num:`01`,title:`Discovery & Admission`,module:`python/fastast/discovery.py`,desc:`Multi-layer ignore filtering (.gitignore, .fastastignore) and SHA-256 content hashing.`},{num:`02`,title:`Rust Tree-Sitter AST Core`,module:`src/lib.rs`,desc:`Compiled Rust Tree-Sitter parsers extracting symbols, signatures, imports, and calls across 9 languages.`},{num:`03`,title:`SQLite WAL Graph Store`,module:`python/fastast/db.py`,desc:`Persistent relational graph (.fastast.db) storing files, symbols, calls, edges, and FTS5 postings.`},{num:`04`,title:`Hybrid Retrieval & Evidence`,module:`python/fastast/retrieval.py`,desc:`Combines BM25 lexical search, dense embeddings, and graph degree centrality into token-bounded snippets.`},{num:`05`,title:`Louvain & MinHash LSH`,module:`python/fastast/communities.py`,desc:`Detects modular subsystems via Louvain community detection and near-duplicate symbols via MinHash LSH.`},{num:`06`,title:`CLI, MCP & HTTP Bridge`,module:`python/fastast/api_server.py`,desc:`Exposes identical codebase memory tools over CLI, stdio MCP JSON-RPC, and HTTP REST API (:4200).`}],e[4]=m):m=e[4];let h=m,g;e[5]===Symbol.for(`react.memo_cache_sentinel`)?(g=(0,H.jsxs)(`div`,{children:[(0,H.jsx)(`h1`,{className:`arch-title`,children:`Repository Architecture & Hotspots`}),(0,H.jsx)(`p`,{className:`arch-subtitle`,children:`Live architectural subsystems, central hub symbols, and FastAST pipeline map`})]}),e[5]=g):g=e[5];let v;e[6]===n?v=e[7]:(v=n&&(0,H.jsxs)(`div`,{className:`arch-metrics font-code`,children:[(0,H.jsxs)(`span`,{className:`metric-chip`,children:[(0,H.jsx)(`strong`,{children:n.files}),` files`]}),(0,H.jsxs)(`span`,{className:`metric-chip`,children:[(0,H.jsx)(`strong`,{className:`text-primary`,children:n.symbols}),` symbols`]}),(0,H.jsxs)(`span`,{className:`metric-chip`,children:[(0,H.jsx)(`strong`,{className:`text-tertiary`,children:n.edges}),` edges`]})]}),e[6]=n,e[7]=v);let y;e[8]===v?y=e[9]:(y=(0,H.jsxs)(`div`,{className:`arch-header`,children:[g,v]}),e[8]=v,e[9]=y);let b;e[10]===u?b=e[11]:(b=u&&(0,H.jsx)(`div`,{className:`api-error-banner`,children:(0,H.jsx)(`div`,{children:u})}),e[10]=u,e[11]=b);let x;e[12]===Symbol.for(`react.memo_cache_sentinel`)?(x=(0,H.jsx)(`span`,{children:`Top Central Hub Symbols (Live Graph Degree)`}),e[12]=x):x=e[12];let S;e[13]===c.length?S=e[14]:(S=(0,H.jsxs)(`div`,{className:`panel-hdr font-code`,children:[x,(0,H.jsxs)(`span`,{className:`text-primary`,children:[c.length,` hubs`]})]}),e[13]=c.length,e[14]=S);let C;e[15]!==c||e[16]!==t?(C=(0,H.jsx)(`div`,{className:`hubs-table-wrap font-code`,children:c.length>0?(0,H.jsxs)(`table`,{className:`arch-table`,children:[(0,H.jsx)(`thead`,{children:(0,H.jsxs)(`tr`,{children:[(0,H.jsx)(`th`,{children:`Symbol`}),(0,H.jsx)(`th`,{children:`Kind`}),(0,H.jsx)(`th`,{children:`Module Path`}),(0,H.jsx)(`th`,{children:`Degree`})]})}),(0,H.jsx)(`tbody`,{children:c.slice(0,10).map(e=>(0,H.jsxs)(`tr`,{onClick:()=>t(`/explore?file=${encodeURIComponent(e.file_path)}&symbol=${encodeURIComponent(e.name)}`),children:[(0,H.jsx)(`td`,{className:`text-primary font-semibold`,children:e.name}),(0,H.jsx)(`td`,{children:(0,H.jsx)(`span`,{className:`kind-pill`,children:e.kind})}),(0,H.jsx)(`td`,{className:`text-outline`,children:e.file_path}),(0,H.jsx)(`td`,{className:`text-tertiary font-bold`,children:e.degree})]},e.id))})]}):(0,H.jsx)(`div`,{className:`p-4 text-outline text-xs`,children:`Loading hub symbols...`})}),e[15]=c,e[16]=t,e[17]=C):C=e[17];let w;e[18]!==S||e[19]!==C?(w=(0,H.jsxs)(`div`,{className:`arch-panel`,children:[S,C]}),e[18]=S,e[19]=C,e[20]=w):w=e[20];let T;e[21]===Symbol.for(`react.memo_cache_sentinel`)?(T=(0,H.jsx)(`span`,{children:`Detected Architectural Subsystems (Louvain)`}),e[21]=T):T=e[21];let E;e[22]===a.length?E=e[23]:(E=(0,H.jsxs)(`div`,{className:`panel-hdr font-code`,children:[T,(0,H.jsxs)(`span`,{className:`text-secondary`,children:[a.length,` clusters`]})]}),e[22]=a.length,e[23]=E);let D;if(e[24]!==a||e[25]!==t){let n;e[27]===t?n=e[28]:(n=e=>(0,H.jsxs)(`div`,{className:`subsystem-row`,onClick:()=>t(`/communities`),children:[(0,H.jsxs)(`div`,{className:`flex items-center gap-2 min-w-0`,children:[(0,H.jsx)(`span`,{className:`sub-dot`,style:{backgroundColor:e.color}}),(0,H.jsx)(`span`,{className:`font-semibold text-on-surface truncate`,children:e.name})]}),(0,H.jsxs)(`span`,{className:`text-outline text-xs`,children:[e.member_count,` symbols • Q=`,e.modularity]})]},e.id),e[27]=t,e[28]=n),D=a.slice(0,8).map(n),e[24]=a,e[25]=t,e[26]=D}else D=e[26];let O;e[29]===D?O=e[30]:(O=(0,H.jsx)(`div`,{className:`subsystems-list font-code`,children:D}),e[29]=D,e[30]=O);let k;e[31]!==E||e[32]!==O?(k=(0,H.jsxs)(`div`,{className:`arch-panel`,children:[E,O]}),e[31]=E,e[32]=O,e[33]=k):k=e[33];let A;e[34]!==w||e[35]!==k?(A=(0,H.jsxs)(`div`,{className:`arch-two-col`,children:[w,k]}),e[34]=w,e[35]=k,e[36]=A):A=e[36];let j;e[37]===Symbol.for(`react.memo_cache_sentinel`)?(j=(0,H.jsx)(`div`,{className:`panel-hdr font-code`,children:(0,H.jsx)(`span`,{children:`FastAST Engine Pipeline Modules (Click any module to open in Explore)`})}),e[37]=j):j=e[37];let M;e[38]===t?M=e[39]:(M=(0,H.jsxs)(`div`,{className:`arch-panel`,children:[j,(0,H.jsx)(`div`,{className:`stages-grid`,children:h.map(e=>(0,H.jsxs)(`div`,{className:`stage-card`,onClick:()=>t(`/explore?file=${encodeURIComponent(e.module)}`),children:[(0,H.jsxs)(`div`,{className:`stage-top font-code`,children:[(0,H.jsx)(`span`,{className:`stage-num`,children:e.num}),(0,H.jsx)(`span`,{className:`stage-mod`,children:e.module})]}),(0,H.jsx)(`div`,{className:`stage-title`,children:e.title}),(0,H.jsx)(`p`,{className:`stage-desc`,children:e.desc})]},e.num))})]}),e[38]=t,e[39]=M);let N;e[40]!==A||e[41]!==M||e[42]!==b?(N=(0,H.jsxs)(`div`,{className:`arch-scroll`,children:[b,A,M]}),e[40]=A,e[41]=M,e[42]=b,e[43]=N):N=e[43];let P;e[44]===Symbol.for(`react.memo_cache_sentinel`)?(P=(0,H.jsx)(`style`,{children:`
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
      `}),e[44]=P):P=e[44];let F;return e[45]!==N||e[46]!==y?(F=(0,H.jsxs)(`div`,{className:`arch-page`,children:[y,N,P]}),e[45]=N,e[46]=y,e[47]=F):F=e[47],F},Jn=()=>{let e=lt(),[t,n]=(0,_.useState)([]),[r,i]=(0,_.useState)(null),[a,o]=(0,_.useState)(!0),[s,c]=(0,_.useState)(null),l=async()=>{o(!0),c(null);try{let e=await Kn.getCommunities(30);n(e),e.length>0?i(e[0]):i(null)}catch(e){c(e?.message||`Failed to load communities from /api/communities.`)}finally{o(!1)}};(0,_.useEffect)(()=>{l()},[]);let u=(t,n)=>{let r=new URLSearchParams;t&&r.set(`file`,t),n&&r.set(`symbol`,n),e(`/explore?${r.toString()}`)},d=t=>{e(t?`/globe?symbol=${encodeURIComponent(t)}`:`/globe`)};return(0,H.jsxs)(`div`,{className:`comm-page`,children:[(0,H.jsxs)(`div`,{className:`comm-header`,children:[(0,H.jsxs)(`div`,{children:[(0,H.jsx)(`h1`,{className:`comm-title`,children:`Louvain Modularity Communities`}),(0,H.jsx)(`p`,{className:`comm-subtitle`,children:`Structural graph clusters detected from call, import, and definition edges`})]}),(0,H.jsxs)(`div`,{className:`comm-meta-badge font-code`,children:[(0,H.jsx)(`span`,{className:`material-symbols-outlined text-sm text-tertiary`,children:`bubble_chart`}),(0,H.jsxs)(`span`,{children:[t.length,` Communities Loaded`]})]})]}),s&&(0,H.jsx)(`div`,{className:`p-4`,children:(0,H.jsxs)(`div`,{className:`api-error-banner`,children:[(0,H.jsx)(`div`,{children:s}),(0,H.jsx)(`button`,{className:`api-retry-btn`,onClick:l,children:`Retry`})]})}),(0,H.jsxs)(`div`,{className:`comm-body`,children:[(0,H.jsx)(`div`,{className:`comm-list-col`,children:a?(0,H.jsx)(`div`,{className:`p-6 text-center text-outline font-code`,children:`Loading communities from SQLite...`}):t.length>0?t.map(e=>{let t=r?.id===e.id;return(0,H.jsxs)(`div`,{className:`comm-card ${t?`comm-card-selected`:``}`,onClick:()=>i(e),children:[(0,H.jsxs)(`div`,{className:`comm-card-top`,children:[(0,H.jsxs)(`div`,{className:`comm-name-wrap`,children:[(0,H.jsx)(`span`,{className:`comm-dot`,style:{backgroundColor:e.color}}),(0,H.jsx)(`span`,{className:`comm-card-name truncate`,children:e.name})]}),(0,H.jsxs)(`span`,{className:`comm-card-count font-code`,children:[e.member_count,` symbols`]})]}),e.sample_symbols&&e.sample_symbols.length>0&&(0,H.jsxs)(`div`,{className:`comm-card-samples font-code`,children:[(0,H.jsx)(`span`,{className:`text-outline`,children:`Hubs: `}),(0,H.jsx)(`span`,{className:`text-on-surface-variant`,children:e.sample_symbols.slice(0,4).join(`, `)})]})]},e.id)}):(0,H.jsx)(`div`,{className:`p-6 text-center text-outline font-code`,children:`No communities found in index. Run Re-index to compute Louvain clusters.`})}),(0,H.jsx)(`div`,{className:`comm-detail-col`,children:r?(0,H.jsxs)(`div`,{className:`comm-detail-card`,children:[(0,H.jsxs)(`div`,{className:`detail-header`,children:[(0,H.jsxs)(`div`,{className:`detail-title-group`,children:[(0,H.jsx)(`span`,{className:`detail-dot`,style:{backgroundColor:r.color}}),(0,H.jsxs)(`div`,{children:[(0,H.jsx)(`h2`,{className:`detail-title`,children:r.name}),(0,H.jsxs)(`span`,{className:`font-code text-xs text-outline`,children:[`Community #`,r.id,` • Modularity Q = `,r.modularity,` •`,` `,r.member_count,` symbols`]})]})]}),(0,H.jsxs)(`div`,{className:`detail-actions`,children:[(0,H.jsxs)(`button`,{className:`btn-primary-sm`,onClick:()=>d(r.members?.[0]?.name||r.sample_symbols?.[0]),children:[(0,H.jsx)(`span`,{className:`material-symbols-outlined text-xs`,children:`public`}),(0,H.jsx)(`span`,{children:`Focus Hub in Globe`})]}),(0,H.jsxs)(`button`,{className:`btn-secondary-sm`,onClick:()=>u(r.sample_files?.[0],r.sample_symbols?.[0]),children:[(0,H.jsx)(`span`,{className:`material-symbols-outlined text-xs`,children:`account_tree`}),(0,H.jsx)(`span`,{children:`Open in Explore`})]})]})]}),(0,H.jsxs)(`div`,{className:`detail-section`,children:[(0,H.jsxs)(`span`,{className:`section-label`,children:[`Contributing Files (`,r.sample_files?.length||0,`) — Click to Explore`]}),(0,H.jsx)(`div`,{className:`pills-wrap font-code`,children:r.sample_files&&r.sample_files.length>0?r.sample_files.map((e,t)=>(0,H.jsxs)(`button`,{className:`file-pill`,onClick:()=>u(e),children:[(0,H.jsx)(`span`,{className:`material-symbols-outlined text-xs text-primary`,children:`description`}),(0,H.jsx)(`span`,{children:e})]},t)):(0,H.jsx)(`span`,{className:`text-outline text-xs`,children:`No files listed`})})]}),(0,H.jsxs)(`div`,{className:`detail-section`,children:[(0,H.jsxs)(`span`,{className:`section-label`,children:[`Community Member Symbols (`,r.members?.length||r.sample_symbols.length,`)`]}),r.members&&r.members.length>0?(0,H.jsx)(`div`,{className:`members-table-wrap font-code`,children:(0,H.jsxs)(`table`,{className:`members-table`,children:[(0,H.jsx)(`thead`,{children:(0,H.jsxs)(`tr`,{children:[(0,H.jsx)(`th`,{children:`Kind`}),(0,H.jsx)(`th`,{children:`Symbol`}),(0,H.jsx)(`th`,{children:`File`}),(0,H.jsx)(`th`,{children:`Lines`}),(0,H.jsx)(`th`,{children:`Actions`})]})}),(0,H.jsx)(`tbody`,{children:r.members.map(e=>(0,H.jsxs)(`tr`,{children:[(0,H.jsx)(`td`,{children:(0,H.jsx)(`span`,{className:`kind-chip`,children:e.kind})}),(0,H.jsx)(`td`,{className:`text-primary font-semibold`,children:e.name}),(0,H.jsx)(`td`,{className:`text-outline`,children:e.file_path}),(0,H.jsxs)(`td`,{className:`text-outline`,children:[`L`,e.start_line,`–`,e.end_line]}),(0,H.jsx)(`td`,{children:(0,H.jsxs)(`div`,{className:`row-btns`,children:[(0,H.jsx)(`button`,{className:`row-btn`,onClick:()=>u(e.file_path,e.name),children:`Explore`}),(0,H.jsx)(`button`,{className:`row-btn`,onClick:()=>d(e.name),children:`Globe`})]})})]},e.id))})]})}):(0,H.jsx)(`div`,{className:`pills-wrap font-code`,children:r.sample_symbols.map((e,t)=>(0,H.jsx)(`button`,{className:`file-pill`,onClick:()=>d(e),children:(0,H.jsx)(`span`,{className:`text-primary`,children:e})},t))})]})]}):(0,H.jsx)(`div`,{className:`comm-empty font-code`,children:`Select a community from the left list to inspect its member symbols and files.`})})]}),(0,H.jsx)(`style`,{children:`
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
      `})]})},Yn=()=>{let[e,t]=(0,_.useState)(null),[n,r]=(0,_.useState)(null),[i,a]=(0,_.useState)([]),[o,s]=(0,_.useState)(!0),[c,l]=(0,_.useState)(null),u=async()=>{s(!0),l(null);try{let[e,n,i]=await Promise.all([Kn.getStats(),Kn.getDiagnostics(),Kn.getFiles()]);t(e),r(n),a(i)}catch(e){l(e?.message||`Failed to load index coverage data.`)}finally{s(!1)}};(0,_.useEffect)(()=>{u()},[]);let d={python:`#38bdf8`,rust:`#f97316`,typescript:`#3b82f6`,javascript:`#eab308`,markdown:`#94a3b8`,json:`#fbbf24`,html:`#f43f5e`,css:`#06b6d4`,toml:`#a855f7`,java:`#ef4444`},f=e?.files??0,p=n?.coverage?.disk_files_count??f,m=i.filter(e=>e.has_syntax_error).length,h=Math.max(0,p-f),g=_.useMemo(()=>e?.languages?Object.entries(e.languages).sort((e,t)=>t[1]-e[1]).map(([e,t])=>({name:e.charAt(0).toUpperCase()+e.slice(1),key:e,count:t,color:d[e.toLowerCase()]||`#a855f7`})):[],[e]),v=_.useMemo(()=>e?.categories?Object.entries(e.categories).sort((e,t)=>t[1]-e[1]):[],[e]),y=_.useMemo(()=>e?.symbol_kinds?Object.entries(e.symbol_kinds).sort((e,t)=>t[1]-e[1]):[],[e]);return(0,H.jsxs)(`div`,{className:`coverage-page`,children:[(0,H.jsxs)(`div`,{className:`coverage-header`,children:[(0,H.jsxs)(`div`,{children:[(0,H.jsx)(`h1`,{className:`coverage-title`,children:`Repository Index Coverage`}),(0,H.jsx)(`p`,{className:`coverage-subtitle`,children:`Live file admission, language distribution, symbol kinds, and parse health from .fastast.db`})]}),(0,H.jsxs)(`button`,{className:`refresh-btn font-code`,onClick:u,disabled:o,children:[(0,H.jsx)(`span`,{className:`material-symbols-outlined text-xs ${o?`spin-icon`:``}`,children:`refresh`}),(0,H.jsx)(`span`,{children:`Refresh`})]})]}),(0,H.jsxs)(`div`,{className:`coverage-body`,children:[c&&(0,H.jsxs)(`div`,{className:`api-error-banner`,children:[(0,H.jsx)(`div`,{children:c}),(0,H.jsx)(`button`,{className:`api-retry-btn`,onClick:u,children:`Retry`})]}),(0,H.jsxs)(`div`,{className:`summary-cards-row`,children:[(0,H.jsxs)(`div`,{className:`summary-card`,children:[(0,H.jsx)(`span`,{className:`card-label`,children:`Admitted & Indexed Files`}),(0,H.jsx)(`span`,{className:`card-val font-code text-primary`,children:f.toLocaleString()}),(0,H.jsxs)(`span`,{className:`card-sub font-code`,children:[p,` on disk • `,h,` pending • `,m,` syntax errors`]})]}),(0,H.jsxs)(`div`,{className:`summary-card`,children:[(0,H.jsx)(`span`,{className:`card-label`,children:`Extracted AST Symbols`}),(0,H.jsx)(`span`,{className:`card-val font-code text-secondary`,children:(e?.symbols??0).toLocaleString()}),(0,H.jsx)(`span`,{className:`card-sub font-code`,children:y.slice(0,3).map(([e,t])=>`${t} ${e}s`).join(`, `)||`No symbols`})]}),(0,H.jsxs)(`div`,{className:`summary-card`,children:[(0,H.jsx)(`span`,{className:`card-label`,children:`Graph Relationships`}),(0,H.jsx)(`span`,{className:`card-val font-code text-tertiary`,children:(e?.edges??0).toLocaleString()}),(0,H.jsxs)(`span`,{className:`card-sub font-code`,children:[(e?.calls??0).toLocaleString(),` calls • `,(e?.imports??0).toLocaleString(),` `,`imports`]})]}),(0,H.jsxs)(`div`,{className:`summary-card`,children:[(0,H.jsx)(`span`,{className:`card-label`,children:`File Categories`}),(0,H.jsx)(`div`,{className:`cat-chips font-code`,children:v.map(([e,t])=>(0,H.jsxs)(`span`,{className:`cat-chip`,children:[(0,H.jsx)(`strong`,{children:t}),` `,e]},e))}),(0,H.jsxs)(`span`,{className:`card-sub font-code`,children:[g.length,` active languages`]})]})]}),(0,H.jsxs)(`div`,{className:`section-card`,children:[(0,H.jsxs)(`span`,{className:`table-title font-code`,children:[`Indexed Language Distribution (`,g.length,` Languages)`]}),g.length>0?(0,H.jsx)(`div`,{className:`languages-grid`,children:g.map(e=>{let t=f>0?Math.round(e.count/f*1e3)/10:0;return(0,H.jsxs)(`div`,{className:`lang-box`,children:[(0,H.jsxs)(`div`,{className:`lang-box-top`,children:[(0,H.jsxs)(`div`,{className:`flex items-center gap-2`,children:[(0,H.jsx)(`span`,{className:`lang-dot`,style:{backgroundColor:e.color}}),(0,H.jsx)(`span`,{className:`font-semibold`,children:e.name})]}),(0,H.jsxs)(`span`,{className:`font-code text-xs text-outline`,children:[e.count,` files`]})]}),(0,H.jsx)(`div`,{className:`lang-meter`,children:(0,H.jsx)(`div`,{className:`lang-meter-bar`,style:{width:`${Math.max(2,t)}%`,backgroundColor:e.color}})}),(0,H.jsx)(`div`,{className:`lang-box-bottom font-code text-xs`,children:(0,H.jsxs)(`span`,{className:`text-on-surface-variant`,children:[t,`% of indexed files`]})})]},e.key)})}):(0,H.jsx)(`div`,{className:`p-6 text-outline font-code text-center`,children:o?`Loading language metrics...`:`No indexed files found.`})]}),y.length>0&&(0,H.jsxs)(`div`,{className:`section-card`,children:[(0,H.jsx)(`span`,{className:`table-title font-code`,children:`AST Symbol Kinds Breakdown`}),(0,H.jsx)(`div`,{className:`kinds-grid font-code`,children:y.map(([e,t])=>(0,H.jsxs)(`div`,{className:`kind-stat-box`,children:[(0,H.jsx)(`span`,{className:`text-outline uppercase text-xs`,children:e}),(0,H.jsx)(`strong`,{className:`text-lg text-on-surface`,children:t.toLocaleString()})]},e))})]})]}),(0,H.jsx)(`style`,{children:`
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
      `})]})},Xn=()=>{let e=lt(),[t,n]=On(),r=t.get(`q`)||``,[i,a]=(0,_.useState)(r||`retrieve_context`),[o,s]=(0,_.useState)(2048),[c,l]=(0,_.useState)(`hybrid`),[u,d]=(0,_.useState)(null),[f,p]=(0,_.useState)(null),[m,h]=(0,_.useState)(!1),[g,v]=(0,_.useState)(null),[y,b]=(0,_.useState)(!1),x=(0,_.useCallback)(async(e,t=o,n=c)=>{if(!e.trim())d({query:``,ranking_method:n,total_tokens_estimate:0,max_tokens:t,candidates:[],snippets:[]}),p(null);else{h(!0),v(null);try{let r=await Kn.getEvidence(e.trim(),t,n);d(r),r.candidates&&r.candidates.length>0?p(r.candidates[0]):p(null)}catch(e){v(e?.message||`Failed to retrieve evidence bundle.`),d(null)}finally{h(!1)}}},[o,c]);(0,_.useEffect)(()=>{let e=r||i;r&&r!==i&&a(r),x(e,o,c)},[r,o,c]);let S=()=>{n(i.trim()?{q:i.trim()}:{}),x(i,o,c)},C=()=>{u&&(navigator.clipboard.writeText(JSON.stringify(u,null,2)),b(!0),setTimeout(()=>b(!1),2e3))},w=u?.total_tokens_estimate??0,T=Math.min(100,Math.round(w/o*100)),E=_.useMemo(()=>{if(!u?.snippets)return[];if(!f)return u.snippets;let e=u.snippets.filter(e=>e.symbol_name===f.name),t=u.snippets.filter(e=>e.symbol_name!==f.name);return[...e,...t]},[u,f]);return(0,H.jsxs)(`div`,{className:`evidence-page`,children:[(0,H.jsxs)(`div`,{className:`evidence-header`,children:[(0,H.jsxs)(`div`,{className:`search-row`,children:[(0,H.jsxs)(`div`,{className:`search-input-group`,children:[(0,H.jsx)(`span`,{className:`material-symbols-outlined search-icon`,children:`manage_search`}),(0,H.jsx)(`input`,{type:`text`,value:i,onChange:e=>a(e.target.value),onKeyDown:e=>e.key===`Enter`&&S(),placeholder:`Query symbol name or concept (e.g. 'index_repository', 'Louvain community detection')...`,className:`evidence-search-input font-code`}),i&&(0,H.jsx)(`button`,{className:`clear-btn`,onClick:()=>{a(``),x(``,o,c)},children:`×`})]}),(0,H.jsxs)(`button`,{className:`btn-retrieve`,onClick:S,disabled:m,children:[(0,H.jsx)(`span`,{className:`material-symbols-outlined text-sm ${m?`spin-icon`:``}`,children:m?`sync`:`bolt`}),(0,H.jsx)(`span`,{children:m?`Retrieving...`:`Retrieve Evidence`})]})]}),(0,H.jsxs)(`div`,{className:`controls-row`,children:[(0,H.jsxs)(`div`,{className:`ranking-selector`,children:[(0,H.jsx)(`span`,{className:`ctrl-label`,children:`Ranking:`}),[`hybrid`,`rrf`,`bm25`,`semantic`,`heuristic`].map(e=>(0,H.jsx)(`button`,{className:`mode-btn ${c===e?`mode-btn-active`:``}`,onClick:()=>l(e),children:e.toUpperCase()},e))]}),(0,H.jsxs)(`div`,{className:`token-meter-wrap`,children:[(0,H.jsx)(`span`,{className:`ctrl-label`,children:`Token Budget:`}),(0,H.jsxs)(`select`,{value:o,onChange:e=>s(Number(e.target.value)),className:`budget-select font-code`,children:[(0,H.jsx)(`option`,{value:1024,children:`1,024 tokens`}),(0,H.jsx)(`option`,{value:2048,children:`2,048 tokens`}),(0,H.jsx)(`option`,{value:4096,children:`4,096 tokens`})]}),(0,H.jsx)(`div`,{className:`token-meter-bar`,children:(0,H.jsx)(`div`,{className:`token-meter-fill`,style:{width:`${T}%`}})}),(0,H.jsxs)(`span`,{className:`token-meter-text font-code`,children:[w.toLocaleString(),` / `,o.toLocaleString(),` tok (`,T,`%)`]})]}),(0,H.jsxs)(`button`,{className:`btn-copy-bundle font-code`,onClick:C,disabled:!u||u.candidates.length===0,children:[(0,H.jsx)(`span`,{className:`material-symbols-outlined text-sm`,children:`content_copy`}),(0,H.jsx)(`span`,{children:y?`Copied JSON!`:`Copy JSON Bundle`})]})]})]}),(0,H.jsxs)(`div`,{className:`evidence-body`,children:[g&&(0,H.jsx)(`div`,{className:`mb-3`,children:(0,H.jsxs)(`div`,{className:`api-error-banner`,children:[(0,H.jsxs)(`div`,{children:[(0,H.jsx)(`strong`,{children:`Evidence Query Error:`}),` `,g]}),(0,H.jsx)(`button`,{className:`api-retry-btn`,onClick:S,children:`Retry`})]})}),m?(0,H.jsxs)(`div`,{className:`state-box font-code`,children:[(0,H.jsx)(`span`,{className:`material-symbols-outlined spin-icon text-2xl text-primary`,children:`sync`}),(0,H.jsx)(`span`,{children:`Ranking symbols and extracting token-bounded AST snippets...`})]}):i.trim()?u&&u.candidates.length===0?(0,H.jsxs)(`div`,{className:`state-box font-code`,children:[(0,H.jsx)(`span`,{className:`material-symbols-outlined text-2xl text-outline`,children:`search_off`}),(0,H.jsxs)(`span`,{children:[`No matching symbols or evidence found for "`,u.query,`".`]})]}):u?(0,H.jsxs)(`div`,{className:`evidence-grid`,children:[(0,H.jsxs)(`div`,{className:`candidates-col`,children:[(0,H.jsxs)(`div`,{className:`col-header font-code`,children:[(0,H.jsxs)(`span`,{children:[`Ranked Candidates (`,u.candidates.length,`)`]}),(0,H.jsx)(`span`,{className:`text-primary`,children:u.ranking_method.toUpperCase()})]}),(0,H.jsx)(`div`,{className:`candidates-scroll`,children:u.candidates.map((t,n)=>{let r=f?.name===t.name&&f?.file_path===t.file_path;return(0,H.jsxs)(`div`,{className:`cand-card ${r?`cand-card-selected`:``}`,onClick:()=>p(t),children:[(0,H.jsxs)(`div`,{className:`cand-row-top font-code`,children:[(0,H.jsxs)(`span`,{className:`cand-rank`,children:[`#`,n+1]}),(0,H.jsx)(`span`,{className:`cand-kind`,children:t.kind}),(0,H.jsx)(`span`,{className:`cand-name truncate`,children:t.name}),(0,H.jsx)(`span`,{className:`cand-score`,children:t.score.toFixed(3)})]}),(0,H.jsxs)(`div`,{className:`cand-row-file font-code`,children:[(0,H.jsx)(`span`,{className:`truncate`,children:t.file_path}),(0,H.jsxs)(`span`,{children:[`L`,t.start_line,`–`,t.end_line]})]}),t.reasons&&t.reasons.length>0&&(0,H.jsx)(`div`,{className:`reasons-row font-code`,children:t.reasons.slice(0,4).map((e,t)=>(0,H.jsx)(`span`,{className:`reason-tag`,children:e},t))}),r&&(0,H.jsxs)(`div`,{className:`cand-actions`,children:[(0,H.jsx)(`button`,{className:`mini-act-btn`,onClick:n=>{n.stopPropagation(),e(`/explore?file=${encodeURIComponent(t.file_path)}&symbol=${encodeURIComponent(t.name)}`)},children:`Explore`}),(0,H.jsx)(`button`,{className:`mini-act-btn`,onClick:n=>{n.stopPropagation(),e(`/globe?symbol=${encodeURIComponent(t.name)}`)},children:`Focus in Globe`})]})]},`${t.name}-${t.file_path}-${n}`)})})]}),(0,H.jsxs)(`div`,{className:`snippets-col`,children:[f&&(0,H.jsxs)(`div`,{className:`selected-cand-banner font-code`,children:[(0,H.jsxs)(`div`,{className:`sel-banner-top`,children:[(0,H.jsxs)(`div`,{children:[(0,H.jsx)(`span`,{className:`text-primary font-bold text-sm`,children:f.name}),` `,(0,H.jsxs)(`span`,{className:`text-outline text-xs`,children:[`(`,f.file_path,`:L`,f.start_line,`–`,f.end_line,`)`]})]}),(0,H.jsxs)(`span`,{className:`text-tertiary text-xs`,children:[`Score: `,f.score.toFixed(3)]})]}),f.reasons&&f.reasons.length>0&&(0,H.jsxs)(`div`,{className:`sel-banner-sub`,children:[(0,H.jsx)(`span`,{className:`text-outline`,children:`Ranking Signals: `}),f.reasons.join(` • `)]}),f.neighbors&&f.neighbors.length>0&&(0,H.jsxs)(`div`,{className:`sel-banner-sub`,children:[(0,H.jsx)(`span`,{className:`text-outline`,children:`Graph Neighbors: `}),f.neighbors.slice(0,6).map(e=>`${e.name||e.symbol} (${e.relation||`calls`})`).join(`, `)]})]}),(0,H.jsxs)(`div`,{className:`col-header font-code`,children:[(0,H.jsxs)(`span`,{children:[`Bounded Evidence Windows (`,E.length,`)`]}),(0,H.jsxs)(`span`,{className:`text-tertiary`,children:[`Total ~`,w.toLocaleString(),` tokens`]})]}),(0,H.jsx)(`div`,{className:`snippets-scroll`,children:E.map((t,n)=>{let r=f?.name===t.symbol_name;return(0,H.jsxs)(`div`,{className:`snippet-card ${r?`snippet-card-highlighted`:``}`,children:[(0,H.jsxs)(`div`,{className:`snippet-header font-code`,children:[(0,H.jsxs)(`div`,{className:`snippet-meta`,children:[(0,H.jsx)(`span`,{className:`text-primary font-bold`,children:t.symbol_name}),(0,H.jsxs)(`span`,{className:`text-outline text-xs`,children:[t.file_path,` [L`,t.start_line,`–`,t.end_line,`]`]})]}),(0,H.jsxs)(`div`,{className:`snippet-right`,children:[(0,H.jsxs)(`span`,{className:`token-badge`,children:[`~`,t.token_count,` tok`]}),(0,H.jsx)(`button`,{className:`mini-act-btn`,onClick:()=>e(`/explore?file=${encodeURIComponent(t.file_path)}&symbol=${encodeURIComponent(t.symbol_name)}`),children:`Open File`})]})]}),t.reasons&&t.reasons.length>0&&(0,H.jsxs)(`div`,{className:`snippet-reasons font-code`,children:[`Signals: `,t.reasons.join(` · `)]}),(0,H.jsx)(`pre`,{className:`snippet-code font-code`,children:t.snippet})]},`${t.symbol_name}-${n}`)})})]})]}):null:(0,H.jsxs)(`div`,{className:`state-box font-code`,children:[(0,H.jsx)(`span`,{className:`material-symbols-outlined text-2xl text-outline`,children:`search`}),(0,H.jsx)(`span`,{children:`Enter a symbol or natural-language query above to retrieve bounded evidence.`})]})]}),(0,H.jsx)(`style`,{children:`
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
      `})]})},Zn=()=>{let e=lt(),t=ot(),[n,r]=On(),i=t.state,a=n.get(`file`)||i?.filePath||``,o=n.get(`symbol`)||i?.symbolName||``,[s,c]=(0,_.useState)([]),[l,u]=(0,_.useState)(a),[d,f]=(0,_.useState)([]),[p,m]=(0,_.useState)(o),[h,g]=(0,_.useState)(``),[v,y]=(0,_.useState)(``),[b,x]=(0,_.useState)(`snippet`),[S,C]=(0,_.useState)(null),[w,T]=(0,_.useState)({callers:[],callees:[]}),[E,D]=(0,_.useState)([]),[O,k]=(0,_.useState)(!0),[A,j]=(0,_.useState)(!1),[M,N]=(0,_.useState)(!1),[P,F]=(0,_.useState)(null),I=async()=>{k(!0),F(null);try{let e=await Kn.getFiles();if(c(e),!l&&o){let e=await Kn.searchSymbols(o,void 0,void 0,5),t=e.find(e=>e.name===o)||e[0];if(t?.file_path){u(t.file_path);return}}if(!l&&e.length>0){let t=e.find(e=>e.path===`python/fastast/retrieval.py`)||e.find(e=>e.category===`source`&&(e.symbol_count??0)>0)||e[0];u(t.path)}}catch(e){F(e?.message||`Failed to load repository files from /api/files.`)}finally{k(!1)}};(0,_.useEffect)(()=>{I()},[]),(0,_.useEffect)(()=>{let e=n.get(`file`),t=n.get(`symbol`);e&&e!==l&&u(e),t&&t!==p&&m(t)},[n]),(0,_.useEffect)(()=>{if(!l)return;let e=!1;return j(!0),Kn.getOutline(l).then(t=>{e||(f(t),j(!1),t.length>0?t.find(e=>e.name===p)||m(t[0].name):(m(``),Kn.getSnippet(void 0,l,1,60).then(t=>{e||C(t)}).catch(()=>{})))}).catch(t=>{e||(F(t?.message||`Failed to load file outline.`),j(!1))}),()=>{e=!0}},[l]),(0,_.useEffect)(()=>{if(!p)return;let e=!1;return N(!0),Promise.all([Kn.getSnippet(p,l||void 0).catch(()=>null),Kn.getCallGraph(p).catch(()=>({symbol:p,callers:[],callees:[]})),Kn.getSimilarSymbols(p,6).catch(()=>[])]).then(([t,n,r])=>{e||(C(t),T({callers:n.callers||[],callees:n.callees||[]}),D(r||[]),N(!1))}),()=>{e=!0}},[p,l]);let L=(0,_.useMemo)(()=>d.find(e=>e.name===p)||d[0],[d,p]),ee=(0,_.useMemo)(()=>{let e=h.trim().toLowerCase();return e?s.filter(t=>t.path.toLowerCase().includes(e)||t.language.toLowerCase().includes(e)):s},[s,h]),te=(0,_.useMemo)(()=>{let e=v.trim().toLowerCase();return e?d.filter(t=>t.name.toLowerCase().includes(e)||t.kind.toLowerCase().includes(e)||(t.signature||``).toLowerCase().includes(e)):d},[d,v]),ne=(0,_.useMemo)(()=>S?.content?S.content.split(`
`):[],[S]),re=e=>{u(e),r({file:e})},ie=(e,t)=>{t&&t!==l?(u(t),m(e),r({file:t,symbol:e})):(m(e),r({file:l,symbol:e}))};return(0,H.jsxs)(`div`,{className:`explore-layout`,children:[(0,H.jsxs)(`aside`,{className:`explore-left`,children:[(0,H.jsxs)(`div`,{className:`subpanel files-subpanel`,children:[(0,H.jsxs)(`div`,{className:`subpanel-header`,children:[(0,H.jsx)(`span`,{className:`material-symbols-outlined text-primary text-sm`,children:`folder_open`}),(0,H.jsxs)(`span`,{className:`subpanel-title`,children:[`Indexed Files (`,ee.length,`)`]})]}),(0,H.jsx)(`div`,{className:`filter-box`,children:(0,H.jsx)(`input`,{type:`text`,value:h,onChange:e=>g(e.target.value),placeholder:`Filter files by path or language...`,className:`filter-input font-code`})}),(0,H.jsx)(`div`,{className:`subpanel-list font-code`,children:O?(0,H.jsx)(`div`,{className:`empty-msg`,children:`Loading files...`}):ee.length>0?ee.map(e=>{let t=e.path===l;return(0,H.jsxs)(`div`,{className:`tree-row ${t?`tree-row-active`:``}`,onClick:()=>re(e.path),title:`${e.path} (${e.language}, ${e.lines} lines)`,children:[(0,H.jsx)(`span`,{className:`tree-path truncate`,children:e.path}),(0,H.jsx)(`span`,{className:`tree-meta`,children:e.symbol_count!==void 0&&e.symbol_count>0?`${e.symbol_count} sym`:`${e.lines}L`})]},e.path)}):(0,H.jsx)(`div`,{className:`empty-msg`,children:`No matching files`})})]}),(0,H.jsxs)(`div`,{className:`subpanel outline-subpanel`,children:[(0,H.jsxs)(`div`,{className:`subpanel-header`,children:[(0,H.jsx)(`span`,{className:`material-symbols-outlined text-secondary text-sm`,children:`data_object`}),(0,H.jsxs)(`span`,{className:`subpanel-title`,children:[`File Symbols (`,te.length,`)`]})]}),(0,H.jsx)(`div`,{className:`filter-box`,children:(0,H.jsx)(`input`,{type:`text`,value:v,onChange:e=>y(e.target.value),placeholder:`Filter symbols in file...`,className:`filter-input font-code`})}),(0,H.jsx)(`div`,{className:`subpanel-list font-code`,children:A?(0,H.jsx)(`div`,{className:`empty-msg`,children:`Loading AST outline...`}):te.length>0?te.map(e=>{let t=e.name===p;return(0,H.jsxs)(`div`,{className:`tree-row ${t?`tree-row-active`:``}`,onClick:()=>ie(e.name),children:[(0,H.jsxs)(`div`,{className:`sym-row-left`,children:[(0,H.jsx)(`span`,{className:`sym-kind-tag kind-${e.kind.toLowerCase()}`,children:e.kind.slice(0,3).toUpperCase()}),(0,H.jsx)(`span`,{className:`tree-path truncate`,children:e.name})]}),(0,H.jsxs)(`span`,{className:`tree-meta`,children:[`L`,e.start_line,`–`,e.end_line]})]},`${e.id}-${e.start_line}`)}):(0,H.jsx)(`div`,{className:`empty-msg`,children:`No AST symbols extracted in this file`})})]})]}),(0,H.jsxs)(`main`,{className:`explore-center`,children:[(0,H.jsxs)(`div`,{className:`center-toolbar`,children:[(0,H.jsxs)(`div`,{className:`breadcrumb font-code`,children:[(0,H.jsx)(`span`,{className:`material-symbols-outlined text-primary text-sm`,children:`description`}),(0,H.jsx)(`span`,{className:`text-on-surface font-semibold`,children:l||`Select a file`}),p&&(0,H.jsxs)(H.Fragment,{children:[(0,H.jsx)(`span`,{className:`text-outline`,children:`/`}),(0,H.jsx)(`span`,{className:`text-primary font-bold`,children:p})]})]}),(0,H.jsxs)(`div`,{className:`view-tabs`,children:[(0,H.jsx)(`button`,{className:`tab-btn ${b===`snippet`?`tab-btn-active`:``}`,onClick:()=>x(`snippet`),children:`Bounded Snippet`}),(0,H.jsxs)(`button`,{className:`tab-btn ${b===`outline`?`tab-btn-active`:``}`,onClick:()=>x(`outline`),children:[`AST Outline (`,d.length,`)`]}),(0,H.jsxs)(`button`,{className:`tab-btn ${b===`calls`?`tab-btn-active`:``}`,onClick:()=>x(`calls`),children:[`Call Neighborhood (`,w.callers.length+w.callees.length,`)`]})]}),(0,H.jsx)(`div`,{className:`toolbar-actions`,children:p&&(0,H.jsxs)(H.Fragment,{children:[(0,H.jsxs)(`button`,{className:`act-btn act-btn-secondary`,onClick:()=>e(`/evidence?q=${encodeURIComponent(p)}`),children:[(0,H.jsx)(`span`,{className:`material-symbols-outlined text-xs`,children:`manage_search`}),(0,H.jsx)(`span`,{children:`Evidence`})]}),(0,H.jsxs)(`button`,{className:`act-btn act-btn-primary`,onClick:()=>e(`/globe?symbol=${encodeURIComponent(p)}`),children:[(0,H.jsx)(`span`,{className:`material-symbols-outlined text-xs`,children:`public`}),(0,H.jsx)(`span`,{children:`Focus in Globe`})]})]})})]}),P&&(0,H.jsx)(`div`,{className:`p-3`,children:(0,H.jsxs)(`div`,{className:`api-error-banner`,children:[(0,H.jsx)(`div`,{children:P}),(0,H.jsx)(`button`,{className:`api-retry-btn`,onClick:I,children:`Retry`})]})}),b===`snippet`&&(0,H.jsxs)(`div`,{className:`code-viewer-wrap`,children:[(0,H.jsxs)(`div`,{className:`code-meta-bar font-code`,children:[(0,H.jsxs)(`span`,{children:[S?.file_path||l,` • Lines`,` `,S?.start_line??L?.start_line??1,`–`,S?.end_line??L?.end_line??1]}),(0,H.jsxs)(`span`,{className:`text-tertiary`,children:[`Bounded AST Window (~`,S?.tokens||Math.max(10,ne.length*7),` `,`tokens)`]})]}),(0,H.jsx)(`div`,{className:`code-scroll font-code`,children:M?(0,H.jsx)(`div`,{className:`p-6 text-outline`,children:`Extracting bounded AST snippet...`}):ne.length>0?ne.map((e,t)=>{let n=(S?.start_line??1)+t;return(0,H.jsxs)(`div`,{className:`code-line`,children:[(0,H.jsx)(`span`,{className:`line-num`,children:n}),(0,H.jsx)(`span`,{className:`line-text`,children:e||` `})]},t)}):(0,H.jsx)(`div`,{className:`p-6 text-outline`,children:`Select a symbol or file to view its bounded source window.`})})]}),b===`outline`&&(0,H.jsx)(`div`,{className:`outline-table-wrap font-code`,children:d.length>0?(0,H.jsxs)(`table`,{className:`ast-table`,children:[(0,H.jsx)(`thead`,{children:(0,H.jsxs)(`tr`,{children:[(0,H.jsx)(`th`,{children:`Kind`}),(0,H.jsx)(`th`,{children:`Symbol`}),(0,H.jsx)(`th`,{children:`Signature`}),(0,H.jsx)(`th`,{children:`Lines`})]})}),(0,H.jsx)(`tbody`,{children:d.map(e=>(0,H.jsxs)(`tr`,{className:e.name===p?`row-selected`:``,onClick:()=>{ie(e.name),x(`snippet`)},children:[(0,H.jsx)(`td`,{children:(0,H.jsx)(`span`,{className:`sym-kind-tag kind-${e.kind.toLowerCase()}`,children:e.kind})}),(0,H.jsx)(`td`,{className:`text-primary font-semibold`,children:e.name}),(0,H.jsx)(`td`,{className:`text-on-surface-variant truncate max-w-md`,children:e.signature}),(0,H.jsxs)(`td`,{className:`text-outline`,children:[`L`,e.start_line,`–`,e.end_line]})]},`${e.id}-${e.start_line}`))})]}):(0,H.jsxs)(`div`,{className:`p-6 text-outline`,children:[`No AST symbols found in `,l,`.`]})}),b===`calls`&&(0,H.jsxs)(`div`,{className:`calls-tab-wrap font-code`,children:[(0,H.jsxs)(`div`,{className:`calls-col`,children:[(0,H.jsxs)(`div`,{className:`calls-col-hdr`,children:[`Inbound Callers (`,w.callers.length,`)`]}),w.callers.length>0?w.callers.map((e,t)=>(0,H.jsxs)(`div`,{className:`call-card`,onClick:()=>e.caller&&ie(e.caller,e.file_path),children:[(0,H.jsx)(`span`,{className:`text-primary font-semibold`,children:e.caller}),(0,H.jsxs)(`span`,{className:`text-outline text-xs`,children:[e.file_path,`:L`,e.line_number]})]},t)):(0,H.jsx)(`div`,{className:`text-outline text-xs`,children:`No inbound callers recorded`})]}),(0,H.jsxs)(`div`,{className:`calls-col`,children:[(0,H.jsxs)(`div`,{className:`calls-col-hdr`,children:[`Outbound Callees (`,w.callees.length,`)`]}),w.callees.length>0?w.callees.map((e,t)=>(0,H.jsxs)(`div`,{className:`call-card`,onClick:()=>e.callee&&ie(e.callee,e.file_path),children:[(0,H.jsx)(`span`,{className:`text-tertiary font-semibold`,children:e.callee}),(0,H.jsxs)(`span`,{className:`text-outline text-xs`,children:[e.file_path,`:L`,e.line_number]})]},t)):(0,H.jsx)(`div`,{className:`text-outline text-xs`,children:`No outbound callees recorded`})]})]})]}),(0,H.jsxs)(`aside`,{className:`explore-right`,children:[(0,H.jsxs)(`div`,{className:`subpanel-header`,children:[(0,H.jsx)(`span`,{className:`material-symbols-outlined text-primary text-sm`,children:`info`}),(0,H.jsx)(`span`,{className:`subpanel-title`,children:`Symbol Details`})]}),L?(0,H.jsxs)(`div`,{className:`right-scroll`,children:[(0,H.jsxs)(`div`,{className:`detail-box`,children:[(0,H.jsxs)(`div`,{className:`flex justify-between items-center`,children:[(0,H.jsx)(`span`,{className:`sym-kind-tag`,children:L.kind.toUpperCase()}),(0,H.jsxs)(`span`,{className:`font-code text-xs text-outline`,children:[`L`,L.start_line,`–`,L.end_line]})]}),(0,H.jsx)(`div`,{className:`detail-sym-name font-code`,children:L.name}),(0,H.jsx)(`div`,{className:`font-code text-xs text-outline truncate`,children:L.file_path||l}),L.signature&&(0,H.jsx)(`pre`,{className:`detail-sig font-code`,children:L.signature}),L.docstring&&(0,H.jsx)(`p`,{className:`detail-doc`,children:L.docstring})]}),(0,H.jsxs)(`div`,{className:`detail-box`,children:[(0,H.jsxs)(`div`,{className:`box-hdr font-code`,children:[`Inbound Callers (`,w.callers.length,`)`]}),w.callers.length>0?(0,H.jsx)(`div`,{className:`mini-list font-code`,children:w.callers.slice(0,10).map((e,t)=>(0,H.jsxs)(`div`,{className:`mini-item`,onClick:()=>e.caller&&ie(e.caller,e.file_path),children:[(0,H.jsx)(`span`,{className:`text-primary truncate`,children:e.caller}),(0,H.jsxs)(`span`,{className:`text-outline text-xs`,children:[`L`,e.line_number]})]},t))}):(0,H.jsx)(`div`,{className:`text-xs text-outline font-code`,children:`None`})]}),(0,H.jsxs)(`div`,{className:`detail-box`,children:[(0,H.jsxs)(`div`,{className:`box-hdr font-code`,children:[`Outbound Callees (`,w.callees.length,`)`]}),w.callees.length>0?(0,H.jsx)(`div`,{className:`mini-list font-code`,children:w.callees.slice(0,10).map((e,t)=>(0,H.jsxs)(`div`,{className:`mini-item`,onClick:()=>e.callee&&ie(e.callee,e.file_path),children:[(0,H.jsx)(`span`,{className:`text-tertiary truncate`,children:e.callee}),(0,H.jsxs)(`span`,{className:`text-outline text-xs`,children:[`L`,e.line_number]})]},t))}):(0,H.jsx)(`div`,{className:`text-xs text-outline font-code`,children:`None`})]}),(0,H.jsxs)(`div`,{className:`detail-box`,children:[(0,H.jsxs)(`div`,{className:`box-hdr font-code`,children:[`Similar Symbols (`,E.length,`)`]}),E.length>0?(0,H.jsx)(`div`,{className:`mini-list font-code`,children:E.map((e,t)=>(0,H.jsxs)(`div`,{className:`mini-item`,onClick:()=>ie(e.name,e.file_path),children:[(0,H.jsx)(`span`,{className:`text-secondary truncate`,children:e.name}),(0,H.jsxs)(`span`,{className:`text-outline text-xs`,children:[Math.round(e.similarity*100),`%`]})]},t))}):(0,H.jsx)(`div`,{className:`text-xs text-outline font-code`,children:`None detected`})]})]}):(0,H.jsx)(`div`,{className:`p-4 text-xs text-outline font-code`,children:`Select a symbol to inspect metadata and relationships.`})]}),(0,H.jsx)(`style`,{children:`
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
      `})]})},Qn={CALLS:`#38bdf8`,IMPORTS:`#10b981`,DEFINES:`#a855f7`,INHERITS:`#f59e0b`,SIMILAR_TO:`#ec4899`},$n={function:`#38bdf8`,method:`#60a5fa`,class:`#a855f7`,type:`#818cf8`,struct:`#f59e0b`,file:`#10b981`,module:`#10b981`},er={mode:`full`,depth:2,total_nodes:18,total_edges:20,repo_total_nodes:142,repo_total_edges:284,communities:[{id:0,name:`Database & Storage`,color:`#38bdf8`,count:6},{id:1,name:`API Server`,color:`#10b981`,count:5},{id:2,name:`AST Parser`,color:`#a855f7`,count:3},{id:3,name:`Imported Modules`,color:`#34d399`,count:3},{id:4,name:`Testing Suite`,color:`#f59e0b`,count:1}],nodes:[{id:`get_call_graph`,name:`get_call_graph`,kind:`function`,file_path:`python/fastast/db.py`,start_line:120,end_line:145,language:`python`,in_degree:3,out_degree:3,comm:0,comm_name:`Database & Storage`,comm_color:`#38bdf8`,importance:.95,signature:`def get_call_graph(conn, symbol_name: str)`},{id:`CodeGraph`,name:`CodeGraph`,kind:`class`,file_path:`python/fastast/graph.py`,start_line:15,end_line:85,language:`python`,in_degree:2,out_degree:2,comm:0,comm_name:`Database & Storage`,comm_color:`#38bdf8`,importance:.9,signature:`class CodeGraph`},{id:`CodeGraph.add_node`,name:`CodeGraph.add_node`,kind:`method`,file_path:`python/fastast/graph.py`,start_line:30,end_line:45,language:`python`,in_degree:1,out_degree:0,comm:0,comm_name:`Database & Storage`,comm_color:`#38bdf8`,importance:.7,signature:`def add_node(self, node: Node) -> None`},{id:`CodeGraph.add_edge`,name:`CodeGraph.add_edge`,kind:`method`,file_path:`python/fastast/graph.py`,start_line:50,end_line:65,language:`python`,in_degree:1,out_degree:0,comm:0,comm_name:`Database & Storage`,comm_color:`#38bdf8`,importance:.7,signature:`def add_edge(self, u: str, v: str, rel: str) -> None`},{id:`sqlite.cursor`,name:`sqlite.cursor`,kind:`function`,file_path:`external:sqlite3`,start_line:1,end_line:1,language:`python`,in_degree:1,out_degree:0,comm:0,comm_name:`Database & Storage`,comm_color:`#38bdf8`,importance:.6,signature:`cursor()`},{id:`format_edges`,name:`format_edges`,kind:`function`,file_path:`python/fastast/db.py`,start_line:165,end_line:185,language:`python`,in_degree:1,out_degree:1,comm:0,comm_name:`Database & Storage`,comm_color:`#38bdf8`,importance:.7,signature:`def format_edges(rows)`},{id:`FastASTAPIHandler`,name:`FastASTAPIHandler`,kind:`class`,file_path:`python/fastast/api_server.py`,start_line:168,end_line:230,language:`python`,in_degree:2,out_degree:2,comm:1,comm_name:`API Server`,comm_color:`#10b981`,importance:.88,signature:`class FastASTAPIHandler(BaseHTTPRequestHandler)`},{id:`FastASTAPIHandler.do_GET`,name:`FastASTAPIHandler.do_GET`,kind:`method`,file_path:`python/fastast/api_server.py`,start_line:218,end_line:280,language:`python`,in_degree:1,out_degree:1,comm:1,comm_name:`API Server`,comm_color:`#10b981`,importance:.82,signature:`def do_GET(self) -> None`},{id:`FastASTAPIHandler.do_POST`,name:`FastASTAPIHandler.do_POST`,kind:`method`,file_path:`python/fastast/api_server.py`,start_line:190,end_line:215,language:`python`,in_degree:1,out_degree:0,comm:1,comm_name:`API Server`,comm_color:`#10b981`,importance:.75,signature:`def do_POST(self) -> None`},{id:`handle_graph`,name:`handle_graph`,kind:`function`,file_path:`python/fastast/api_server.py`,start_line:84,end_line:110,language:`python`,in_degree:2,out_degree:1,comm:1,comm_name:`API Server`,comm_color:`#10b981`,importance:.8,signature:`def handle_graph(self) -> None`},{id:`server.inspect`,name:`server.inspect`,kind:`method`,file_path:`python/fastast/server.py`,start_line:210,end_line:235,language:`python`,in_degree:1,out_degree:1,comm:1,comm_name:`API Server`,comm_color:`#10b981`,importance:.75,signature:`def inspect(self, symbol: str)`},{id:`ASTParser`,name:`ASTParser`,kind:`class`,file_path:`python/fastast/parser.py`,start_line:20,end_line:95,language:`python`,in_degree:2,out_degree:2,comm:2,comm_name:`AST Parser`,comm_color:`#a855f7`,importance:.85,signature:`class ASTParser`},{id:`ASTParser.extract_symbols`,name:`ASTParser.extract_symbols`,kind:`method`,file_path:`python/fastast/parser.py`,start_line:35,end_line:60,language:`python`,in_degree:1,out_degree:0,comm:2,comm_name:`AST Parser`,comm_color:`#a855f7`,importance:.75,signature:`def extract_symbols(self, code: str)`},{id:`parse_edge_kind`,name:`parse_edge_kind`,kind:`function`,file_path:`python/fastast/parser.py`,start_line:44,end_line:60,language:`python`,in_degree:1,out_degree:0,comm:2,comm_name:`AST Parser`,comm_color:`#a855f7`,importance:.65,signature:`def parse_edge_kind(kind: str)`},{id:`sqlite3`,name:`sqlite3`,kind:`module`,file_path:`external:sqlite3`,start_line:1,end_line:1,language:`python`,in_degree:1,out_degree:0,comm:3,comm_name:`Imported Modules`,comm_color:`#34d399`,importance:.85,signature:`import sqlite3`},{id:`fastast.model`,name:`fastast.model`,kind:`module`,file_path:`python/fastast/model.py`,start_line:1,end_line:50,language:`python`,in_degree:1,out_degree:0,comm:3,comm_name:`Imported Modules`,comm_color:`#34d399`,importance:.8,signature:`from fastast.model import Candidate, SymbolRecord`},{id:`typing`,name:`typing`,kind:`module`,file_path:`stdlib:typing`,start_line:1,end_line:1,language:`python`,in_degree:1,out_degree:0,comm:3,comm_name:`Imported Modules`,comm_color:`#34d399`,importance:.75,signature:`import typing`},{id:`test_get_call_graph`,name:`test_get_call_graph`,kind:`function`,file_path:`tests/test_db.py`,start_line:32,end_line:55,language:`python`,in_degree:0,out_degree:1,comm:4,comm_name:`Testing Suite`,comm_color:`#f59e0b`,importance:.7,signature:`def test_get_call_graph()`}],edges:[{source:`CodeGraph`,target:`CodeGraph.add_node`,type:`DEFINES`},{source:`CodeGraph`,target:`CodeGraph.add_edge`,type:`DEFINES`},{source:`FastASTAPIHandler`,target:`FastASTAPIHandler.do_GET`,type:`DEFINES`},{source:`FastASTAPIHandler`,target:`FastASTAPIHandler.do_POST`,type:`DEFINES`},{source:`ASTParser`,target:`ASTParser.extract_symbols`,type:`DEFINES`},{source:`FastASTAPIHandler.do_GET`,target:`handle_graph`,type:`CALLS`},{source:`handle_graph`,target:`get_call_graph`,type:`CALLS`},{source:`test_get_call_graph`,target:`get_call_graph`,type:`CALLS`},{source:`server.inspect`,target:`get_call_graph`,type:`CALLS`},{source:`get_call_graph`,target:`sqlite.cursor`,type:`CALLS`},{source:`get_call_graph`,target:`format_edges`,type:`CALLS`},{source:`format_edges`,target:`parse_edge_kind`,type:`CALLS`},{source:`get_call_graph`,target:`sqlite3`,type:`IMPORTS`},{source:`get_call_graph`,target:`fastast.model`,type:`IMPORTS`},{source:`get_call_graph`,target:`typing`,type:`IMPORTS`}]},tr=[{module:`sqlite3`,name:null,file_path:`python/fastast/db.py`,line_number:4},{module:`fastast.model`,name:`Candidate`,file_path:`python/fastast/db.py`,line_number:10},{module:`typing`,name:`Dict`,file_path:`python/fastast/db.py`,line_number:7},{module:`fastast.config`,name:`get_logger`,file_path:`python/fastast/db.py`,line_number:9}],nr=({connectionVersion:e=0,onNavigateToExplore:t})=>{let n=(0,_.useRef)(null),r=(0,_.useRef)(null),[i,a]=(0,_.useState)(er),[o,s]=(0,_.useState)(er.nodes[0]),[c,l]=(0,_.useState)([]),[u,d]=(0,_.useState)([]),[f,p]=(0,_.useState)(tr),[m,h]=(0,_.useState)(!1),[g,v]=(0,_.useState)(!1),[y,b]=(0,_.useState)(!1),[x,S]=(0,_.useState)(``),[C,w]=(0,_.useState)(1),[T,E]=(0,_.useState)({CALLS:!0,IMPORTS:!0,DEFINES:!0,SIMILAR_TO:!0}),[D,O]=(0,_.useState)(!0),[k,A]=(0,_.useState)({x:0,y:0}),[j,M]=(0,_.useState)(1),N=(0,_.useRef)([]),P=(0,_.useCallback)(e=>{let t=(e??C)===`all`;Kn.getGlobeTopology({mode:`full`,maxNodes:t?450:200,maxEdges:t?1400:600}).then(e=>{e&&e.nodes&&e.nodes.length>0?(a(e),h(!1)):h(!0)}).catch(()=>{h(!0)})},[C]);(0,_.useEffect)(()=>{P()},[e,P]),(0,_.useEffect)(()=>{o?(v(!0),Kn.getCallGraph(o.name).then(e=>{l(e.callers||[]),d(e.callees||[]),p(e.imports||[]),v(!1)}).catch(()=>{l([]),d([]),p([]),v(!1)})):(l([]),d([]),p([]))},[o]);let F=(0,_.useMemo)(()=>{let e={CALLS:0,IMPORTS:0,DEFINES:0,SIMILAR_TO:0};return(i.edges||[]).forEach(t=>{let n=(t.type||`CALLS`).toUpperCase();e[n]=(e[n]||0)+1}),f.length>e.IMPORTS&&(e.IMPORTS=f.length),e},[i.edges,f]),I=(0,_.useMemo)(()=>{if(!x.trim())return[];let e=x.toLowerCase();return(i.nodes||[]).filter(t=>t.name.toLowerCase().includes(e)||t.file_path&&t.file_path.toLowerCase().includes(e)).slice(0,10)},[x,i.nodes]),L=(0,_.useCallback)(()=>{A({x:0,y:0}),M(1)},[]);return(0,_.useEffect)(()=>{let e=r.current,t=n.current;if(!e||!t)return;let a=e.getContext(`2d`);if(!a)return;let l,d=0,p=!1,m=!1,h=null,g={x:0,y:0},_=!1,v=new Map;i.nodes.forEach(e=>{v.set(e.id,e),v.set(e.name,e)});let y=o||i.nodes[0];if(!y)return;let b=t.clientWidth||900,x=t.clientHeight||650,S=new Map,w=[],E=y.name,O=y.comm_color||$n[y.kind]||`#38bdf8`;S.set(E,{id:y.id,name:y.name,kind:y.kind||`function`,filePath:y.file_path||``,startLine:y.start_line,endLine:y.end_line,x:b/2,y:x/2,radius:22,color:O,community:y.comm_name||`Core`,inDegree:y.in_degree||c.length,outDegree:y.out_degree||u.length,isCenter:!0,isInbound:!1,isOutbound:!1,isImport:!1,rawNode:y});let P=new Set;c.forEach(e=>{e.caller&&P.add(e.caller)}),i.edges.forEach(e=>{let t=e.source??e.src,n=e.target??e.dst;if(n===y.id||n===y.name){let e=v.get(t);e&&P.add(e.name)}});let F=new Set;u.forEach(e=>{e.callee&&F.add(e.callee)}),i.edges.forEach(e=>{let t=e.source??e.src,n=e.target??e.dst;if(t===y.id||t===y.name){let e=v.get(n);e&&F.add(e.name)}});let I=C===`all`,L=C===2,ee=Array.from(P).slice(0,I?100:L?16:8);ee.forEach((e,t)=>{let n=v.get(e),r=x/2+(t-(ee.length-1)/2)*(I?46:62),i=Math.max(90,b/2-(I?320:250)),a=n?.comm_color||$n[n?.kind||`function`]||`#38bdf8`;S.set(e,{id:n?.id||e,name:e,kind:n?.kind||`function`,filePath:n?.file_path||``,startLine:n?.start_line,endLine:n?.end_line,x:i,y:r,radius:15,color:a,community:n?.comm_name||`Caller`,inDegree:n?.in_degree||1,outDegree:n?.out_degree||1,isCenter:!1,isInbound:!0,isOutbound:!1,isImport:!1,isSubNode:n?.kind===`method`||n?.kind===`function`,rawNode:n}),T.CALLS&&w.push({from:e,to:E,type:`CALLS`,color:`#38bdf8`})});let te=Array.from(F).slice(0,I?100:L?16:8);te.forEach((e,t)=>{let n=v.get(e),r=x/2+(t-(te.length-1)/2)*(I?46:62),i=Math.min(b-90,b/2+(I?320:250)),a=n?.comm_color||$n[n?.kind||`function`]||`#a855f7`;S.set(e,{id:n?.id||e,name:e,kind:n?.kind||`function`,filePath:n?.file_path||``,startLine:n?.start_line,endLine:n?.end_line,x:i,y:r,radius:15,color:a,community:n?.comm_name||`Callee`,inDegree:n?.in_degree||1,outDegree:n?.out_degree||1,isCenter:!1,isInbound:!1,isOutbound:!0,isImport:!1,isSubNode:n?.kind===`method`||n?.kind===`function`,rawNode:n}),T.CALLS&&w.push({from:E,to:e,type:`CALLS`,color:`#a855f7`})});let ne=[],re=new Set;if(f.forEach(e=>{let t=e.name?`${e.name}`:e.module;!re.has(t)&&t!==E&&(re.add(t),ne.push({id:`imp_${t}`,name:t,module:e.module,file_path:e.file_path,line:e.line_number}))}),i.edges.forEach(e=>{if((e.type||``).toUpperCase()===`IMPORTS`){let t=e.source??e.src,n=e.target??e.dst,r=v.get(t)?.name||t,i=v.get(n)?.name||n;if((t===y.id||t===y.name||r===y.name)&&i!==E&&!re.has(i)){re.add(i);let e=v.get(n);ne.push({id:e?.id||`imp_${i}`,name:i,module:i,file_path:e?.file_path,line:e?.start_line})}}}),T.IMPORTS){let e=ne.slice(0,I?100:L?16:8);e.forEach((t,n)=>{let r=v.get(t.name)||v.get(t.module),i=e.length,a=Math.min(b-240,Math.max(220,i*(I?85:105))),o=b/2+(i>1?(n/(i-1)-.5)*a:0),s=i>2?Math.sin(n/(i-1)*Math.PI)*26:0,c=Math.max(75,x/2-(I?220:180)-s);S.set(t.name,{id:t.id,name:t.name,kind:r?.kind||`module`,filePath:t.file_path||r?.file_path||``,startLine:t.line||r?.start_line,endLine:r?.end_line,x:o,y:c,radius:14,color:`#10b981`,community:r?.comm_name||`Imported Module`,inDegree:r?.in_degree||1,outDegree:r?.out_degree||0,isCenter:!1,isInbound:!1,isOutbound:!1,isImport:!0,isSubNode:!1,rawNode:r}),w.push({from:E,to:t.name,type:`IMPORTS`,color:`#10b981`})})}if(I){let e=new Map;i.nodes.forEach(t=>{if(!S.has(t.name)){let n=t.comm??0;e.has(n)||e.set(n,[]),e.get(n).push(t)}});let t=Math.max(1,e.size),n=0;e.forEach(e=>{let r=n/t*2*Math.PI-Math.PI/2,i=Math.max(300,Math.min(b,x)*.44),a=b/2+Math.cos(r)*i,o=x/2+i*.76*Math.sin(r);e.forEach((e,t)=>{let n=Math.floor(Math.sqrt(t)),r=Math.max(4,n*6),i=t-n*n,s=40+n*34,c=i/r*2*Math.PI,l=a+Math.cos(c)*s,u=o+s*.85*Math.sin(c),d=e.comm_color||$n[e.kind]||`#38bdf8`,f=e.kind===`method`||e.kind===`function`||e.kind===`type`||!!e.signature&&e.signature.includes(`(`);S.set(e.name,{id:e.id,name:e.name,kind:e.kind,filePath:e.file_path,startLine:e.start_line,endLine:e.end_line,x:l,y:u,radius:e.kind===`class`||e.kind===`module`?16:f?10:13,color:d,community:e.comm_name||`Subsystem`,inDegree:e.in_degree||1,outDegree:e.out_degree||1,isCenter:!1,isInbound:!1,isOutbound:!1,isImport:e.kind===`module`&&(e.file_path?.startsWith(`external`)||e.file_path?.startsWith(`stdlib`)),isSubNode:f,rawNode:e})}),n++})}else if(L){let e=0;for(let t of i.nodes){if(e>=40)break;if(!S.has(t.name)&&i.edges.some(e=>{let n=e.source??e.src,r=e.target??e.dst,i=v.get(n)?.name||n,a=v.get(r)?.name||r;return i===t.name&&S.has(a)||a===t.name&&S.has(i)})){let n=e/40*Math.PI*2;S.set(t.name,{id:t.id,name:t.name,kind:t.kind,filePath:t.file_path,startLine:t.start_line,endLine:t.end_line,x:b/2+Math.cos(n)*310,y:x/2+Math.sin(n)*223.2,radius:12,color:t.comm_color||$n[t.kind]||`#34d399`,community:t.comm_name,inDegree:t.in_degree||1,outDegree:t.out_degree||1,isCenter:!1,isInbound:!1,isOutbound:!1,isImport:!1,isSubNode:t.kind===`method`||t.kind===`function`,rawNode:t}),e++}}}(L||I)&&i.edges.forEach(e=>{let t=e.source??e.src,n=e.target??e.dst,r=v.get(t)?.name||t,i=v.get(n)?.name||n,a=(e.type||`CALLS`).toUpperCase();T[a]&&S.has(r)&&S.has(i)&&(w.some(e=>e.from===r&&e.to===i)||w.push({from:r,to:i,type:a,color:Qn[a]||`#38bdf8`}))});let ie=Array.from(S.values());N.current=ie;let ae=()=>{let n=t.clientWidth,r=t.clientHeight;if(n>0&&r>0){let t=Math.min(window.devicePixelRatio||1,2);e.width=Math.floor(n*t),e.height=Math.floor(r*t)}};ae();let oe=new ResizeObserver(ae);oe.observe(t);let se=(t,n)=>{let r=e.getBoundingClientRect(),i=t-r.left,a=n-r.top;return{x:(i-(r.width/2+k.x))/j+r.width/2,y:(a-(r.height/2+k.y))/j+r.height/2}},ce=e=>{g={x:e.clientX,y:e.clientY},_=!1;let t=se(e.clientX,e.clientY),n=N.current.find(e=>{let n=e.x-t.x,r=e.y-t.y;return Math.sqrt(n*n+r*r)<=e.radius+6});n?(p=!0,h=n):m=!0},le=t=>{let n=t.clientX-g.x,r=t.clientY-g.y;if((Math.abs(n)>3||Math.abs(r)>3)&&(_=!0),p&&h){let e=se(t.clientX,t.clientY);h.x=e.x,h.y=e.y}else if(m)A(e=>({x:e.x+n,y:e.y+r})),g={x:t.clientX,y:t.clientY};else{let n=se(t.clientX,t.clientY),r=N.current.some(e=>{let t=e.x-n.x,r=e.y-n.y;return Math.sqrt(t*t+r*r)<=e.radius+6});e.style.cursor=r?`pointer`:`grab`}},ue=()=>{if(p&&h&&!_){if(h.rawNode)s(h.rawNode);else{let e=v.get(h.name);s(e||{id:h.id,name:h.name,kind:h.kind,file_path:h.filePath,start_line:h.startLine||1,end_line:h.endLine||1,language:`python`,in_degree:h.inDegree,out_degree:h.outDegree,comm:0,comm_name:h.community,comm_color:h.color,importance:.8,signature:`import ${h.name}`})}}p=!1,m=!1,h=null},de=e=>{e.preventDefault();let t=e.deltaY<0?1.1:.9;M(e=>Math.min(2.5,Math.max(.4,e*t)))};e.addEventListener(`mousedown`,ce),window.addEventListener(`mousemove`,le),window.addEventListener(`mouseup`,ue),e.addEventListener(`wheel`,de,{passive:!1});let fe=()=>{let t=Math.min(window.devicePixelRatio||1,2),n=e.width/t,r=e.height/t;if(n<=0||r<=0)l=requestAnimationFrame(fe);else{a.save(),a.scale(t,t),a.clearRect(0,0,n,r),a.translate(n/2+k.x,r/2+k.y),a.scale(j,j),a.translate(-n/2,-r/2),a.strokeStyle=`rgba(255, 255, 255, 0.04)`,a.lineWidth=1;for(let e=-600;e<n+600;e+=44)a.beginPath(),a.moveTo(e,-600),a.lineTo(e,r+600),a.stroke();for(let e=-600;e<r+600;e+=44)a.beginPath(),a.moveTo(-600,e),a.lineTo(n+600,e),a.stroke();w.forEach((e,t)=>{let n=S.get(e.from),r=S.get(e.to);if(!n||!r)return;let i=e.from===y.name||e.to===y.name,o=e.type===`IMPORTS`;a.strokeStyle=i?e.color:`rgba(100, 116, 139, 0.25)`,a.lineWidth=i?o?2:2.2:1,o?a.setLineDash([5,4]):a.setLineDash([]),a.beginPath(),a.moveTo(n.x,n.y),a.lineTo(r.x,r.y),a.stroke(),a.setLineDash([]);let s=Math.atan2(r.y-n.y,r.x-n.x),c=r.radius+3,l=r.x-c*Math.cos(s),u=r.y-c*Math.sin(s);if(a.fillStyle=i?e.color:`rgba(100, 116, 139, 0.4)`,a.beginPath(),a.moveTo(l,u),a.lineTo(l-7*Math.cos(s-Math.PI/7),u-7*Math.sin(s-Math.PI/7)),a.lineTo(l-7*Math.cos(s+Math.PI/7),u-7*Math.sin(s+Math.PI/7)),a.closePath(),a.fill(),D&&i){let i=(d*.015+t*.25)%1,o=n.x+(r.x-n.x)*i,s=n.y+(r.y-n.y)*i;a.beginPath(),a.arc(o,s,3.5,0,Math.PI*2),a.fillStyle=e.color,a.shadowColor=e.color,a.shadowBlur=8,a.fill(),a.shadowBlur=0}}),ie.forEach(e=>{let t=e.isCenter,n=e.isInbound||e.isOutbound,r=e.isImport;t?(a.beginPath(),a.arc(e.x,e.y,e.radius+10,0,Math.PI*2),a.fillStyle=`${e.color}33`,a.fill()):r&&(a.beginPath(),a.arc(e.x,e.y,e.radius+6,0,Math.PI*2),a.fillStyle=`rgba(16, 185, 129, 0.16)`,a.fill()),a.beginPath(),a.arc(e.x,e.y,e.radius,0,Math.PI*2),a.fillStyle=t?e.color:r?`rgba(16, 185, 129, 0.22)`:n?`${e.color}dd`:`#1e293b`,a.fill(),a.strokeStyle=t?`#ffffff`:r?`#10b981`:e.color,a.lineWidth=t?2.5:r?2:1.8,r?a.setLineDash([3,3]):a.setLineDash([]),a.stroke(),a.setLineDash([]),a.font=t?`bold 12px monospace`:r?`600 11px monospace`:`11px monospace`,a.fillStyle=t?`#ffffff`:r?`#34d399`:n?`#f1f5f9`:`#94a3b8`;let i=e.name,o=a.measureText(i).width;if(a.fillText(i,e.x-o/2,e.y+e.radius+15),t||n||r||e.isSubNode||C===`all`){a.font=`9px sans-serif`,a.fillStyle=t?e.color:r?`#10b981`:e.isSubNode?`#c084fc`:`rgba(255, 255, 255, 0.6)`;let n=t?`ACTIVE FOCUS`:r?`IMPORTS`:e.isInbound?`CALLS THIS`:e.isOutbound?`INVOKED BY THIS`:e.isSubNode?e.kind?e.kind.toUpperCase():`SUB-NODE`:e.kind?e.kind.toUpperCase():`NODE`,i=a.measureText(n).width;a.fillText(n,e.x-i/2,e.y-e.radius-6)}}),a.restore(),D&&(d+=1),l=requestAnimationFrame(fe)}};return fe(),()=>{cancelAnimationFrame(l),oe.disconnect(),e.removeEventListener(`mousedown`,ce),window.removeEventListener(`mousemove`,le),window.removeEventListener(`mouseup`,ue),e.removeEventListener(`wheel`,de)}},[i,o,c,u,f,C,T,D,k,j]),(0,H.jsxs)(`div`,{className:`graph2d-page-layout`,children:[(0,H.jsxs)(`aside`,{className:`graph2d-left-panel`,children:[(0,H.jsxs)(`div`,{className:`panel-header`,children:[(0,H.jsxs)(`div`,{className:`flex items-center gap-2`,children:[(0,H.jsx)(`span`,{className:`material-symbols-outlined text-primary text-base`,children:`hub`}),(0,H.jsx)(`span`,{className:`panel-title`,children:`Graph Explorer`})]}),(0,H.jsxs)(`span`,{className:`text-xs text-outline`,children:[i.nodes.length,` nodes`]})]}),(0,H.jsxs)(`div`,{className:`panel-scrollable`,children:[(0,H.jsxs)(`div`,{className:`filter-section`,children:[(0,H.jsxs)(`div`,{className:`search-box`,children:[(0,H.jsx)(`span`,{className:`material-symbols-outlined text-xs text-outline`,children:`search`}),(0,H.jsx)(`input`,{type:`text`,placeholder:`Find symbol...`,value:x,onChange:e=>S(e.target.value),className:`search-input`}),x&&(0,H.jsx)(`button`,{className:`clear-btn`,onClick:()=>S(``),children:`✕`})]}),I.length>0&&(0,H.jsx)(`div`,{className:`search-dropdown`,children:I.map(e=>(0,H.jsxs)(`div`,{className:`search-item`,onClick:()=>{s(e),S(``),L()},children:[(0,H.jsx)(`span`,{className:`font-semibold text-primary truncate`,children:e.name}),(0,H.jsx)(`span`,{className:`text-[10px] text-outline truncate`,children:e.file_path})]},e.id))})]}),(0,H.jsxs)(`div`,{className:`filter-section`,children:[(0,H.jsx)(`span`,{className:`filter-title`,children:`Neighborhood Depth`}),(0,H.jsxs)(`div`,{className:`hop-pill-group`,children:[(0,H.jsx)(`button`,{className:`hop-pill ${C===1?`hop-pill-active`:``}`,onClick:()=>{w(1),M(1),A({x:0,y:0})},children:`1-Hop`}),(0,H.jsx)(`button`,{className:`hop-pill ${C===2?`hop-pill-active`:``}`,onClick:()=>{w(2),M(.85),A({x:0,y:0})},children:`2-Hop`}),(0,H.jsx)(`button`,{className:`hop-pill ${C===`all`?`hop-pill-active`:``}`,onClick:()=>{w(`all`),M(.68),A({x:0,y:0}),P(`all`)},children:`All`})]})]}),(0,H.jsxs)(`div`,{className:`filter-section`,children:[(0,H.jsx)(`span`,{className:`filter-title`,children:`Edge Filters`}),(0,H.jsxs)(`div`,{className:`flex flex-col gap-2 mt-2`,children:[(0,H.jsxs)(`label`,{className:`filter-row`,children:[(0,H.jsx)(`input`,{type:`checkbox`,checked:T.CALLS,onChange:e=>E({...T,CALLS:e.target.checked}),className:`accent-sky-500`}),(0,H.jsx)(`span`,{className:`color-dot bg-sky-400`}),(0,H.jsx)(`span`,{className:`filter-label`,children:`Calls`}),(0,H.jsx)(`span`,{className:`filter-count text-sky-400`,children:F.CALLS||0})]}),(0,H.jsxs)(`label`,{className:`filter-row`,children:[(0,H.jsx)(`input`,{type:`checkbox`,checked:T.IMPORTS,onChange:e=>E({...T,IMPORTS:e.target.checked}),className:`accent-emerald-500`}),(0,H.jsx)(`span`,{className:`color-dot bg-emerald-400`}),(0,H.jsx)(`span`,{className:`filter-label`,children:`Imports`}),(0,H.jsx)(`span`,{className:`filter-count text-emerald-400`,children:F.IMPORTS||0})]}),(0,H.jsxs)(`label`,{className:`filter-row`,children:[(0,H.jsx)(`input`,{type:`checkbox`,checked:T.DEFINES,onChange:e=>E({...T,DEFINES:e.target.checked}),className:`accent-purple-500`}),(0,H.jsx)(`span`,{className:`color-dot bg-purple-400`}),(0,H.jsx)(`span`,{className:`filter-label`,children:`Defines`}),(0,H.jsx)(`span`,{className:`filter-count text-purple-400`,children:F.DEFINES||0})]}),(0,H.jsxs)(`label`,{className:`filter-row`,children:[(0,H.jsx)(`input`,{type:`checkbox`,checked:T.SIMILAR_TO,onChange:e=>E({...T,SIMILAR_TO:e.target.checked}),className:`accent-pink-500`}),(0,H.jsx)(`span`,{className:`color-dot bg-pink-400`}),(0,H.jsx)(`span`,{className:`filter-label`,children:`Similar To`}),(0,H.jsx)(`span`,{className:`filter-count text-pink-400`,children:F.SIMILAR_TO||0})]})]})]}),(0,H.jsxs)(`div`,{className:`filter-section`,children:[(0,H.jsx)(`span`,{className:`filter-title`,children:`Communities (Louvain)`}),(0,H.jsx)(`div`,{className:`flex flex-col gap-1.5 mt-2`,children:(i.communities||[]).slice(0,6).map(e=>(0,H.jsxs)(`div`,{className:`community-item`,onClick:()=>{let t=i.nodes.find(t=>t.comm===e.id);t&&(s(t),L())},children:[(0,H.jsxs)(`div`,{className:`flex items-center gap-2 truncate`,children:[(0,H.jsx)(`span`,{className:`w-2.5 h-2.5 rounded-full flex-shrink-0`,style:{backgroundColor:e.color}}),(0,H.jsx)(`span`,{className:`text-xs truncate`,children:e.name})]}),(0,H.jsx)(`span`,{className:`text-[10px] text-outline font-mono`,children:e.count})]},e.id))})]})]})]}),(0,H.jsxs)(`main`,{ref:n,className:`graph2d-viewport`,children:[(0,H.jsx)(`canvas`,{ref:r,className:`graph2d-canvas`}),(0,H.jsxs)(`div`,{className:`canvas-hud`,children:[(0,H.jsxs)(`div`,{className:`hud-metric-pill`,children:[(0,H.jsx)(`span`,{className:`w-2 h-2 rounded-full bg-emerald-400 animate-pulse`}),(0,H.jsx)(`span`,{className:`text-xs font-semibold text-white`,children:`2D Code Graph`}),(0,H.jsxs)(`span`,{className:`text-xs text-outline font-mono`,children:[i.total_nodes??i.nodes.length,` Nodes • `,i.total_edges??i.edges.length,` Edges`]}),m&&(0,H.jsxs)(`span`,{className:`text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded flex items-center gap-1.5`,children:[(0,H.jsx)(`span`,{children:`Sample Mode (Backend Offline)`}),(0,H.jsx)(`button`,{onClick:()=>{Kn.getGlobeTopology({maxNodes:200}).then(e=>{e?.nodes?.length&&(a(e),s(e.nodes[0]),h(!1))})},className:`underline hover:text-white font-semibold cursor-pointer`,title:`Retry fetching live topology`,children:`Retry`})]})]}),(0,H.jsxs)(`div`,{className:`hud-actions`,children:[(0,H.jsxs)(`button`,{className:`hud-btn`,onClick:()=>O(!D),title:`Toggle edge particle flow animation`,children:[(0,H.jsx)(`span`,{className:`material-symbols-outlined text-sm`,children:D?`pause`:`play_arrow`}),(0,H.jsx)(`span`,{children:D?`Pause`:`Play`})]}),(0,H.jsxs)(`button`,{className:`hud-btn`,onClick:L,title:`Recenter graph view`,children:[(0,H.jsx)(`span`,{className:`material-symbols-outlined text-sm`,children:`center_focus_strong`}),(0,H.jsx)(`span`,{children:`Recenter`})]})]})]}),(0,H.jsxs)(`div`,{className:`canvas-hint`,children:[(0,H.jsx)(`span`,{className:`material-symbols-outlined text-xs text-primary`,children:`mouse`}),(0,H.jsx)(`span`,{children:`Click node to focus callers/callees • Drag node to rearrange • Scroll to zoom • Drag background to pan`})]})]}),(0,H.jsxs)(`aside`,{className:`graph2d-right-panel`,children:[(0,H.jsxs)(`div`,{className:`panel-header`,children:[(0,H.jsx)(`span`,{className:`panel-title`,children:`Symbol Inspector`}),(0,H.jsx)(`span`,{className:`kind-badge uppercase`,children:o.kind||`SYMBOL`})]}),(0,H.jsxs)(`div`,{className:`panel-scrollable`,children:[(0,H.jsxs)(`div`,{className:`inspector-card`,children:[(0,H.jsx)(`div`,{className:`text-sm font-bold font-mono text-white break-all`,children:o.name}),(0,H.jsxs)(`div`,{className:`text-xs font-mono text-outline mt-1 break-all`,children:[o.file_path,`:`,o.start_line||1]}),(0,H.jsxs)(`div`,{className:`grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-[var(--hairline)]`,children:[(0,H.jsxs)(`div`,{className:`stat-box`,children:[(0,H.jsx)(`span`,{className:`stat-label`,children:`In-Degree`}),(0,H.jsx)(`span`,{className:`stat-val text-sky-400 font-mono`,children:o.in_degree||c.length})]}),(0,H.jsxs)(`div`,{className:`stat-box`,children:[(0,H.jsx)(`span`,{className:`stat-label`,children:`Out-Degree`}),(0,H.jsx)(`span`,{className:`stat-val text-purple-400 font-mono`,children:o.out_degree||u.length})]})]}),(0,H.jsxs)(`div`,{className:`mt-3 text-xs flex items-center justify-between text-outline`,children:[(0,H.jsx)(`span`,{children:`Subsystem:`}),(0,H.jsx)(`span`,{className:`font-semibold text-primary`,children:o.comm_name||`Core`})]})]}),(0,H.jsxs)(`div`,{className:`edge-group-section`,children:[(0,H.jsxs)(`div`,{className:`flex items-center justify-between mb-2`,children:[(0,H.jsxs)(`span`,{className:`text-xs font-semibold text-sky-400`,children:[`Inbound Callers (`,c.length,`)`]}),(0,H.jsx)(`span`,{className:`text-[10px] text-outline font-mono`,children:`SQLite Edges`})]}),g?(0,H.jsx)(`div`,{className:`text-xs text-outline py-2`,children:`Loading callers...`}):c.length>0?(0,H.jsx)(`div`,{className:`flex flex-col gap-1.5`,children:c.map((e,n)=>{let r=e.caller||`caller`;return(0,H.jsx)(`div`,{className:`edge-node-row`,onClick:()=>{let n=i.nodes.find(e=>e.name===r||e.id===r);n?(s(n),L()):t?.(r,e.file_path)},title:`Focus ${r}`,children:(0,H.jsxs)(`div`,{className:`truncate`,children:[(0,H.jsxs)(`span`,{className:`text-xs font-mono text-sky-300 font-semibold truncate block`,children:[`← `,r]}),(0,H.jsxs)(`span`,{className:`text-[10px] text-outline truncate block`,children:[e.file_path?e.file_path.split(`/`).pop():``,`:`,e.line_number||1]})]})},n)})}):(0,H.jsx)(`div`,{className:`text-xs text-outline italic py-1`,children:`No inbound callers recorded`})]}),(0,H.jsxs)(`div`,{className:`edge-group-section`,children:[(0,H.jsxs)(`div`,{className:`flex items-center justify-between mb-2`,children:[(0,H.jsxs)(`span`,{className:`text-xs font-semibold text-purple-400`,children:[`Outbound Callees (`,u.length,`)`]}),(0,H.jsx)(`span`,{className:`text-[10px] text-outline font-mono`,children:`SQLite Edges`})]}),g?(0,H.jsx)(`div`,{className:`text-xs text-outline py-2`,children:`Loading callees...`}):u.length>0?(0,H.jsx)(`div`,{className:`flex flex-col gap-1.5`,children:u.map((e,n)=>{let r=e.callee||`callee`;return(0,H.jsx)(`div`,{className:`edge-node-row`,onClick:()=>{let n=i.nodes.find(e=>e.name===r||e.id===r);n?(s(n),L()):t?.(r,e.file_path)},title:`Focus ${r}`,children:(0,H.jsxs)(`div`,{className:`truncate`,children:[(0,H.jsxs)(`span`,{className:`text-xs font-mono text-purple-300 font-semibold truncate block`,children:[`→ `,r]}),(0,H.jsxs)(`span`,{className:`text-[10px] text-outline truncate block`,children:[e.file_path?e.file_path.split(`/`).pop():``,`:`,e.line_number||1]})]})},n)})}):(0,H.jsx)(`div`,{className:`text-xs text-outline italic py-1`,children:`No outbound callees recorded`})]}),(0,H.jsxs)(`div`,{className:`edge-group-section`,children:[(0,H.jsxs)(`div`,{className:`flex items-center justify-between mb-2`,children:[(0,H.jsxs)(`span`,{className:`text-xs font-semibold text-emerald-400`,children:[`Imported Dependencies (`,f.length,`)`]}),(0,H.jsx)(`span`,{className:`text-[10px] text-outline font-mono`,children:`Imports Table`})]}),g?(0,H.jsx)(`div`,{className:`text-xs text-outline py-2`,children:`Loading imports...`}):f.length>0?(0,H.jsx)(`div`,{className:`flex flex-col gap-1.5 max-h-[190px] overflow-y-auto pr-1`,children:f.map((e,n)=>{let r=e.name?`${e.name} (${e.module})`:e.module;return(0,H.jsx)(`div`,{className:`edge-node-row edge-node-row-import`,onClick:()=>{let n=i.nodes.find(t=>t.name===(e.name||e.module)||t.name===e.module);n?(s(n),L()):t?.(e.name||e.module,e.file_path)},title:`Inspect ${r}`,children:(0,H.jsxs)(`div`,{className:`truncate`,children:[(0,H.jsxs)(`span`,{className:`text-xs font-mono text-emerald-300 font-semibold truncate block`,children:[`⇲ `,r]}),(0,H.jsxs)(`span`,{className:`text-[10px] text-outline truncate block`,children:[e.file_path?e.file_path.split(`/`).pop():``,`:`,e.line_number||1]})]})},n)})}):(0,H.jsx)(`div`,{className:`text-xs text-outline italic py-1`,children:`No imports recorded for this symbol`})]}),(0,H.jsxs)(`div`,{className:`mt-auto pt-4 flex flex-col gap-2`,children:[(0,H.jsxs)(`button`,{className:`action-btn action-btn-primary`,onClick:()=>t?.(o.name,o.file_path),children:[(0,H.jsx)(`span`,{className:`material-symbols-outlined text-sm`,children:`code`}),(0,H.jsx)(`span`,{children:`Open in Code Explorer`})]}),(0,H.jsxs)(`button`,{className:`action-btn action-btn-secondary`,onClick:()=>{if(!o)return;let e=JSON.stringify({symbol:o.name,kind:o.kind,file:o.file_path,signature:o.signature,community:o.comm_name,in_degree:o.in_degree,out_degree:o.out_degree,callers:c.map(e=>({caller:e.caller,file:e.file_path,line:e.line_number})),callees:u.map(e=>({callee:e.callee,file:e.file_path,line:e.line_number})),imports:f.map(e=>({module:e.module,name:e.name,file:e.file_path,line:e.line_number}))},null,2);navigator.clipboard.writeText(e),b(!0),setTimeout(()=>b(!1),2e3)},children:[(0,H.jsx)(`span`,{className:`material-symbols-outlined text-sm`,children:`content_copy`}),(0,H.jsx)(`span`,{children:y?`Copied Bundle!`:`Copy LLM Evidence Bundle`})]})]})]})]}),(0,H.jsx)(`style`,{children:`
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
          overflow-y: auto;
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
          padding: 6px 8px;
          border-radius: 4px;
          background: var(--surface-lowest);
          border: 1px solid var(--hairline);
          cursor: pointer;
          transition: all 0.15s;
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
      `})]})},rr=({health:e,apiError:t,onRefreshGlobal:n})=>{let[r,i]=(0,_.useState)(e||null),[a,o]=(0,_.useState)(null),[s,c]=(0,_.useState)(t||null),[l,u]=(0,_.useState)(!1),[d,f]=(0,_.useState)(!1),[p,m]=(0,_.useState)(null),h=async()=>{u(!0),c(null);try{let[e,t]=await Promise.all([Kn.getHealth(),Kn.getDiagnostics()]);i(e),o(t),n?.()}catch(e){c(e?.message||`Failed to reach FastAST API server on port 4200.`),i(null)}finally{u(!1)}};(0,_.useEffect)(()=>{h()},[]);let g=async e=>{f(!0),c(null);try{let t=await Kn.triggerReindex(e);m(t.summary),i(t.health);let r=await Kn.getDiagnostics();o(r),n?.()}catch(e){c(e?.message||`Indexing failed.`)}finally{f(!1)}},v=!(!r?.ok||s),y=a?.database?.size_bytes?(a.database.size_bytes/1024).toFixed(1):`—`,b=r?.last_index_time?new Date(r.last_index_time).toLocaleString():`Not indexed yet`,x=a?[{name:`Backend HTTP API Bridge (:4200)`,status:v?`PASS`:`FAIL`,detail:v?`Reachable at http://127.0.0.1:4200 • Repo: ${r?.repo_path}`:s||`API unreachable`},{name:`SQLite 3 WAL Journal & Integrity`,status:a.database?.integrity_ok?`PASS`:`WARN`,detail:`Journal: ${a.database?.journal_mode||`wal`} • Integrity: ${a.database?.integrity_message||`ok`} • Size: ${y} KB`},{name:`Schema Version & Migrations`,status:a.database?.schema_version===a.database?.expected_schema_version?`PASS`:`WARN`,detail:`Schema v${a.database?.schema_version??`—`} (expected v${a.database?.expected_schema_version??10})`},{name:`Process Lock State`,status:a.lock?.is_stale?`WARN`:`PASS`,detail:`Locked: ${a.lock?.is_locked?`Yes`:`No (Idle)`} • Stale Lock: ${a.lock?.is_stale?`Yes`:`No`}`},{name:`FTS5 BM25 Lexical Index`,status:(a.coverage?.fts_entries_count??0)>0?`PASS`:`WARN`,detail:`${(a.coverage?.fts_entries_count??0).toLocaleString()} FTS5 rows indexed for BM25 retrieval`},{name:`Dense Semantic Embeddings`,status:(a.coverage?.embeddings_count??0)>0?`PASS`:`WARN`,detail:`${(a.coverage?.embeddings_count??0).toLocaleString()} symbol vector embeddings stored`},{name:`Louvain Community Partitioning`,status:(a.coverage?.communities_count??0)>0?`PASS`:`WARN`,detail:`${(a.coverage?.communities_count??0).toLocaleString()} distinct communities detected`}]:[];return(0,H.jsxs)(`div`,{className:`system-page`,children:[(0,H.jsxs)(`div`,{className:`system-header`,children:[(0,H.jsxs)(`div`,{children:[(0,H.jsx)(`h1`,{className:`system-title`,children:`System Health & Index Control`}),(0,H.jsx)(`p`,{className:`system-subtitle`,children:`Live API connectivity, SQLite WAL database status, entity counts, and re-index controls`})]}),(0,H.jsxs)(`div`,{className:`header-actions`,children:[(0,H.jsxs)(`button`,{className:`btn-secondary`,onClick:h,disabled:l,children:[(0,H.jsx)(`span`,{className:`material-symbols-outlined text-sm ${l?`spin-icon`:``}`,children:`sync`}),(0,H.jsx)(`span`,{children:l?`Checking...`:`Run Doctor Check`})]}),(0,H.jsxs)(`button`,{className:`btn-secondary`,onClick:()=>g(!1),disabled:d||!v,children:[(0,H.jsx)(`span`,{className:`material-symbols-outlined text-sm ${d?`spin-icon`:``}`,children:`refresh`}),(0,H.jsx)(`span`,{children:d?`Indexing...`:`Incremental Re-index`})]}),(0,H.jsxs)(`button`,{className:`btn-primary`,onClick:()=>g(!0),disabled:d||!v,children:[(0,H.jsx)(`span`,{className:`material-symbols-outlined text-sm`,children:`bolt`}),(0,H.jsx)(`span`,{children:`Force Full Re-index`})]})]})]}),(0,H.jsxs)(`div`,{className:`system-body`,children:[s&&(0,H.jsxs)(`div`,{className:`api-error-banner`,children:[(0,H.jsxs)(`div`,{children:[(0,H.jsx)(`strong`,{children:`API Connection Error:`}),` `,s]}),(0,H.jsx)(`button`,{className:`api-retry-btn`,onClick:h,children:`Retry`})]}),(0,H.jsxs)(`div`,{className:`status-cards-grid`,children:[(0,H.jsxs)(`div`,{className:`status-card`,children:[(0,H.jsx)(`span`,{className:`card-label`,children:`API Reachable`}),(0,H.jsx)(`div`,{className:`card-value-row`,children:(0,H.jsx)(`span`,{className:`status-indicator ${v?`indicator-yes`:`indicator-no`}`,children:v?`YES (ONLINE)`:`NO (OFFLINE)`})}),(0,H.jsx)(`span`,{className:`card-sub font-code`,children:`http://127.0.0.1:4200/api/health`})]}),(0,H.jsxs)(`div`,{className:`status-card`,children:[(0,H.jsx)(`span`,{className:`card-label`,children:`SQLite Database Path`}),(0,H.jsx)(`span`,{className:`card-val-mono font-code truncate`,title:r?.db_path||``,children:r?.db_path||`Not connected`}),(0,H.jsxs)(`span`,{className:`card-sub font-code`,children:[`Exists: `,r?.db_exists?`Yes (${y} KB)`:`No`]})]}),(0,H.jsxs)(`div`,{className:`status-card`,children:[(0,H.jsx)(`span`,{className:`card-label`,children:`Last Index Timestamp`}),(0,H.jsx)(`span`,{className:`card-val-mono font-code`,children:b}),(0,H.jsxs)(`span`,{className:`card-sub`,children:[`Status: `,(0,H.jsx)(`strong`,{className:`text-tertiary`,children:r?.status?.toUpperCase()||`—`})]})]}),(0,H.jsxs)(`div`,{className:`status-card`,children:[(0,H.jsx)(`span`,{className:`card-label`,children:`Live Indexed Counts`}),(0,H.jsxs)(`div`,{className:`counts-inline font-code`,children:[(0,H.jsxs)(`span`,{children:[(0,H.jsx)(`strong`,{className:`text-on-surface`,children:r?.file_count??`—`}),` files`]}),(0,H.jsx)(`span`,{children:`•`}),(0,H.jsxs)(`span`,{children:[(0,H.jsx)(`strong`,{className:`text-primary`,children:r?.symbol_count??`—`}),` symbols`]}),(0,H.jsx)(`span`,{children:`•`}),(0,H.jsxs)(`span`,{children:[(0,H.jsx)(`strong`,{className:`text-tertiary`,children:r?.edge_count??`—`}),` edges`]})]}),(0,H.jsxs)(`span`,{className:`card-sub font-code`,children:[r?.call_count??`—`,` calls • `,r?.import_count??`—`,` imports`]})]})]}),p&&(0,H.jsx)(`div`,{className:`reindex-banner font-code`,children:(0,H.jsxs)(`div`,{className:`flex items-center gap-2 text-tertiary font-semibold`,children:[(0,H.jsx)(`span`,{className:`material-symbols-outlined text-sm`,children:`check_circle`}),(0,H.jsxs)(`span`,{children:[`Re-index completed in `,p.elapsed_ms,` ms — `,p.indexed_files,` indexed,`,` `,p.skipped_files,` unchanged, `,p.total_symbols,` symbols,`,` `,p.total_edges,` edges.`]})]})}),(0,H.jsxs)(`div`,{className:`diagnostics-card`,children:[(0,H.jsxs)(`div`,{className:`card-header-row`,children:[(0,H.jsx)(`span`,{className:`table-title font-code`,children:`FastAST Doctor Subsystem Checks`}),(0,H.jsxs)(`span`,{className:`font-code text-xs text-outline`,children:[`Overall: `,a?.status?.toUpperCase()||(v?`HEALTHY`:`OFFLINE`)]})]}),x.length>0?(0,H.jsx)(`div`,{className:`diag-list`,children:x.map((e,t)=>(0,H.jsxs)(`div`,{className:`diag-row`,children:[(0,H.jsxs)(`div`,{className:`diag-row-left`,children:[(0,H.jsx)(`span`,{className:`material-symbols-outlined text-sm ${e.status===`PASS`?`text-tertiary`:e.status===`WARN`?`text-amber`:`text-error`}`,children:e.status===`PASS`?`check_circle`:e.status===`WARN`?`warning`:`error`}),(0,H.jsxs)(`div`,{className:`diag-text-col`,children:[(0,H.jsx)(`span`,{className:`diag-name`,children:e.name}),(0,H.jsx)(`span`,{className:`diag-detail font-code`,children:e.detail})]})]}),(0,H.jsx)(`span`,{className:`diag-badge font-code ${e.status===`PASS`?`badge-pass`:e.status===`WARN`?`badge-warn`:`badge-fail`}`,children:e.status})]},t))}):(0,H.jsx)(`div`,{className:`empty-diag font-code`,children:l?`Running repository diagnostics...`:`No diagnostic report available (API offline).`})]}),a?.recommendations&&a.recommendations.length>0&&(0,H.jsxs)(`div`,{className:`recommendations-card font-code`,children:[(0,H.jsx)(`div`,{className:`rec-title`,children:`Doctor Recommendations:`}),a.recommendations.map((e,t)=>(0,H.jsxs)(`div`,{className:`rec-item`,children:[`• `,e]},t))]})]}),(0,H.jsx)(`style`,{children:`
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
      `})]})},ir=()=>{let e=lt(),[t,n]=(0,_.useState)(null),[r,i]=(0,_.useState)(null),[a,o]=(0,_.useState)(null),[s,c]=(0,_.useState)(!1),[l,u]=(0,_.useState)(!1),[d,f]=(0,_.useState)(0),p=(0,_.useCallback)(async()=>{u(!0);try{let[e,t]=await Promise.all([Kn.getHealth(),Kn.getStats()]);i(e),n(t),o(null),f(e=>e+1)}catch(e){o(e?.message||`Cannot connect to FastAST API Server on http://127.0.0.1:4200.`)}finally{u(!1)}},[]);return(0,_.useEffect)(()=>{p()},[p]),(0,_.useEffect)(()=>{if(!a&&r)return;let e=setInterval(()=>{Kn.getHealth().then(()=>{p()}).catch(()=>{})},2500);return()=>clearInterval(e)},[a,r,p]),(0,H.jsxs)(`div`,{className:`app-root`,children:[(0,H.jsx)(Ln,{stats:t,health:r,apiError:a,onSearchSubmit:t=>{e(`/evidence?q=${encodeURIComponent(t)}`)},onReindex:async()=>{c(!0);try{await Kn.triggerReindex(!1),await p()}catch(e){o(e?.message||`Re-index request failed.`)}finally{c(!1)}},onRetryConnection:p,isReindexing:s,isRetrying:l}),(0,H.jsxs)(`div`,{className:`app-body`,children:[(0,H.jsx)(Rn,{stats:t,health:r,apiError:a}),(0,H.jsxs)(`div`,{className:`app-main-viewport`,children:[a&&(0,H.jsx)(`div`,{className:`global-error-strip`,children:(0,H.jsxs)(`div`,{className:`api-error-banner`,children:[(0,H.jsxs)(`div`,{style:{display:`flex`,alignItems:`center`,gap:`10px`},children:[(0,H.jsx)(`span`,{className:`material-symbols-outlined text-error`,children:`error`}),(0,H.jsxs)(`div`,{children:[(0,H.jsx)(`strong`,{children:`Backend API Unreachable:`}),` `,a,` Run`,` `,(0,H.jsx)(`code`,{children:`fastast serve --port 4200`}),` or `,(0,H.jsx)(`code`,{children:`./start_ui.sh`}),` from the repository root.`]})]}),(0,H.jsxs)(`button`,{className:`api-retry-btn`,onClick:p,disabled:l,title:`Retry connection to FastAST API server`,children:[(0,H.jsx)(`span`,{className:`material-symbols-outlined text-xs ${l?`animate-spin`:``}`,children:l?`sync`:`refresh`}),(0,H.jsx)(`span`,{children:l?`Connecting...`:`Retry Connection`})]})]})}),(0,H.jsxs)(Ft,{children:[(0,H.jsx)(Nt,{path:`/`,element:(0,H.jsx)(Mt,{to:`/globe`,replace:!0})}),(0,H.jsx)(Nt,{path:`/globe`,element:(0,H.jsx)(nr,{stats:t,connectionVersion:d,onNavigateToExplore:(t,n)=>{let r=new URLSearchParams;n&&r.set(`file`,n),t&&r.set(`symbol`,t),e(`/explore?${r.toString()}`)}})}),(0,H.jsx)(Nt,{path:`/explore`,element:(0,H.jsx)(Zn,{})}),(0,H.jsx)(Nt,{path:`/architecture`,element:(0,H.jsx)(qn,{})}),(0,H.jsx)(Nt,{path:`/evidence`,element:(0,H.jsx)(Xn,{})}),(0,H.jsx)(Nt,{path:`/coverage`,element:(0,H.jsx)(Yn,{})}),(0,H.jsx)(Nt,{path:`/communities`,element:(0,H.jsx)(Jn,{})}),(0,H.jsx)(Nt,{path:`/system`,element:(0,H.jsx)(rr,{health:r,apiError:a,onRefreshGlobal:p})}),(0,H.jsx)(Nt,{path:`*`,element:(0,H.jsx)(Mt,{to:`/globe`,replace:!0})})]})]})]}),(0,H.jsx)(`style`,{children:`
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
      `})]})};(0,v.createRoot)(document.getElementById(`root`)).render((0,H.jsx)(_.StrictMode,{children:(0,H.jsx)(()=>{let e=(0,In.c)(1),t;return e[0]===Symbol.for(`react.memo_cache_sentinel`)?(t=(0,H.jsx)(xn,{children:(0,H.jsx)(ir,{})}),e[0]=t):t=e[0],t},{})}));