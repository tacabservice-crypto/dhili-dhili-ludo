function $e(e,r){for(var n=0;n<r.length;n++){const d=r[n];if(typeof d!="string"&&!Array.isArray(d)){for(const l in d)if(l!=="default"&&!(l in e)){const i=Object.getOwnPropertyDescriptor(d,l);i&&Object.defineProperty(e,l,i.get?i:{enumerable:!0,get:()=>d[l]})}}}return Object.freeze(Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}))}(function(){const r=document.createElement("link").relList;if(r&&r.supports&&r.supports("modulepreload"))return;for(const l of document.querySelectorAll('link[rel="modulepreload"]'))d(l);new MutationObserver(l=>{for(const i of l)if(i.type==="childList")for(const c of i.addedNodes)c.tagName==="LINK"&&c.rel==="modulepreload"&&d(c)}).observe(document,{childList:!0,subtree:!0});function n(l){const i={};return l.integrity&&(i.integrity=l.integrity),l.referrerPolicy&&(i.referrerPolicy=l.referrerPolicy),l.crossOrigin==="use-credentials"?i.credentials="include":l.crossOrigin==="anonymous"?i.credentials="omit":i.credentials="same-origin",i}function d(l){if(l.ep)return;l.ep=!0;const i=n(l);fetch(l.href,i)}})();function ke(e){return e&&e.__esModule&&Object.prototype.hasOwnProperty.call(e,"default")?e.default:e}var me={exports:{}},se={};/**
 * @license React
 * react-jsx-runtime.production.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var je;function Oe(){if(je)return se;je=1;var e=Symbol.for("react.transitional.element"),r=Symbol.for("react.fragment");function n(d,l,i){var c=null;if(i!==void 0&&(c=""+i),l.key!==void 0&&(c=""+l.key),"key"in l){i={};for(var m in l)m!=="key"&&(i[m]=l[m])}else i=l;return l=i.ref,{$$typeof:e,type:d,key:c,ref:l!==void 0?l:null,props:i}}return se.Fragment=r,se.jsx=n,se.jsxs=n,se}var ve;function De(){return ve||(ve=1,me.exports=Oe()),me.exports}var s=De(),xe={exports:{}},h={};/**
 * @license React
 * react.production.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var we;function Le(){if(we)return h;we=1;var e=Symbol.for("react.transitional.element"),r=Symbol.for("react.portal"),n=Symbol.for("react.fragment"),d=Symbol.for("react.strict_mode"),l=Symbol.for("react.profiler"),i=Symbol.for("react.consumer"),c=Symbol.for("react.context"),m=Symbol.for("react.forward_ref"),y=Symbol.for("react.suspense"),w=Symbol.for("react.memo"),v=Symbol.for("react.lazy"),j=Symbol.for("react.activity"),N=Symbol.iterator;function E(t){return t===null||typeof t!="object"?null:(t=N&&t[N]||t["@@iterator"],typeof t=="function"?t:null)}var P={isMounted:function(){return!1},enqueueForceUpdate:function(){},enqueueReplaceState:function(){},enqueueSetState:function(){}},L=Object.assign,F={};function k(t,a,x){this.props=t,this.context=a,this.refs=F,this.updater=x||P}k.prototype.isReactComponent={},k.prototype.setState=function(t,a){if(typeof t!="object"&&typeof t!="function"&&t!=null)throw Error("takes an object of state variables to update or a function which returns an object of state variables.");this.updater.enqueueSetState(this,t,a,"setState")},k.prototype.forceUpdate=function(t){this.updater.enqueueForceUpdate(this,t,"forceUpdate")};function U(){}U.prototype=k.prototype;function A(t,a,x){this.props=t,this.context=a,this.refs=F,this.updater=x||P}var I=A.prototype=new U;I.constructor=A,L(I,k.prototype),I.isPureReactComponent=!0;var G=Array.isArray;function W(){}var R={H:null,A:null,T:null,S:null},K=Object.prototype.hasOwnProperty;function Z(t,a,x){var f=x.ref;return{$$typeof:e,type:t,key:a,ref:f!==void 0?f:null,props:x}}function ne(t,a){return Z(t.type,a,t.props)}function V(t){return typeof t=="object"&&t!==null&&t.$$typeof===e}function ue(t){var a={"=":"=0",":":"=2"};return"$"+t.replace(/[=:]/g,function(x){return a[x]})}var Q=/\/+/g;function B(t,a){return typeof t=="object"&&t!==null&&t.key!=null?ue(""+t.key):a.toString(36)}function pe(t){switch(t.status){case"fulfilled":return t.value;case"rejected":throw t.reason;default:switch(typeof t.status=="string"?t.then(W,W):(t.status="pending",t.then(function(a){t.status==="pending"&&(t.status="fulfilled",t.value=a)},function(a){t.status==="pending"&&(t.status="rejected",t.reason=a)})),t.status){case"fulfilled":return t.value;case"rejected":throw t.reason}}throw t}function M(t,a,x,f,b){var _=typeof t;(_==="undefined"||_==="boolean")&&(t=null);var S=!1;if(t===null)S=!0;else switch(_){case"bigint":case"string":case"number":S=!0;break;case"object":switch(t.$$typeof){case e:case r:S=!0;break;case v:return S=t._init,M(S(t._payload),a,x,f,b)}}if(S)return b=b(t),S=f===""?"."+B(t,0):f,G(b)?(x="",S!=null&&(x=S.replace(Q,"$&/")+"/"),M(b,a,x,"",function(ae){return ae})):b!=null&&(V(b)&&(b=ne(b,x+(b.key==null||t&&t.key===b.key?"":(""+b.key).replace(Q,"$&/")+"/")+S)),a.push(b)),1;S=0;var $=f===""?".":f+":";if(G(t))for(var C=0;C<t.length;C++)f=t[C],_=$+B(f,C),S+=M(f,a,x,_,b);else if(C=E(t),typeof C=="function")for(t=C.call(t),C=0;!(f=t.next()).done;)f=f.value,_=$+B(f,C++),S+=M(f,a,x,_,b);else if(_==="object"){if(typeof t.then=="function")return M(pe(t),a,x,f,b);throw a=String(t),Error("Objects are not valid as a React child (found: "+(a==="[object Object]"?"object with keys {"+Object.keys(t).join(", ")+"}":a)+"). If you meant to render a collection of children, use an array instead.")}return S}function J(t,a,x){if(t==null)return t;var f=[],b=0;return M(t,f,"","",function(_){return a.call(x,_,b++)}),f}function ee(t){if(t._status===-1){var a=t._result;a=a(),a.then(function(x){(t._status===0||t._status===-1)&&(t._status=1,t._result=x)},function(x){(t._status===0||t._status===-1)&&(t._status=2,t._result=x)}),t._status===-1&&(t._status=0,t._result=a)}if(t._status===1)return t._result.default;throw t._result}var te=typeof reportError=="function"?reportError:function(t){if(typeof window=="object"&&typeof window.ErrorEvent=="function"){var a=new window.ErrorEvent("error",{bubbles:!0,cancelable:!0,message:typeof t=="object"&&t!==null&&typeof t.message=="string"?String(t.message):String(t),error:t});if(!window.dispatchEvent(a))return}else if(typeof process=="object"&&typeof process.emit=="function"){process.emit("uncaughtException",t);return}console.error(t)},fe={map:J,forEach:function(t,a,x){J(t,function(){a.apply(this,arguments)},x)},count:function(t){var a=0;return J(t,function(){a++}),a},toArray:function(t){return J(t,function(a){return a})||[]},only:function(t){if(!V(t))throw Error("React.Children.only expected to receive a single React element child.");return t}};return h.Activity=j,h.Children=fe,h.Component=k,h.Fragment=n,h.Profiler=l,h.PureComponent=A,h.StrictMode=d,h.Suspense=y,h.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE=R,h.__COMPILER_RUNTIME={__proto__:null,c:function(t){return R.H.useMemoCache(t)}},h.cache=function(t){return function(){return t.apply(null,arguments)}},h.cacheSignal=function(){return null},h.cloneElement=function(t,a,x){if(t==null)throw Error("The argument must be a React element, but you passed "+t+".");var f=L({},t.props),b=t.key;if(a!=null)for(_ in a.key!==void 0&&(b=""+a.key),a)!K.call(a,_)||_==="key"||_==="__self"||_==="__source"||_==="ref"&&a.ref===void 0||(f[_]=a[_]);var _=arguments.length-2;if(_===1)f.children=x;else if(1<_){for(var S=Array(_),$=0;$<_;$++)S[$]=arguments[$+2];f.children=S}return Z(t.type,b,f)},h.createContext=function(t){return t={$$typeof:c,_currentValue:t,_currentValue2:t,_threadCount:0,Provider:null,Consumer:null},t.Provider=t,t.Consumer={$$typeof:i,_context:t},t},h.createElement=function(t,a,x){var f,b={},_=null;if(a!=null)for(f in a.key!==void 0&&(_=""+a.key),a)K.call(a,f)&&f!=="key"&&f!=="__self"&&f!=="__source"&&(b[f]=a[f]);var S=arguments.length-2;if(S===1)b.children=x;else if(1<S){for(var $=Array(S),C=0;C<S;C++)$[C]=arguments[C+2];b.children=$}if(t&&t.defaultProps)for(f in S=t.defaultProps,S)b[f]===void 0&&(b[f]=S[f]);return Z(t,_,b)},h.createRef=function(){return{current:null}},h.forwardRef=function(t){return{$$typeof:m,render:t}},h.isValidElement=V,h.lazy=function(t){return{$$typeof:v,_payload:{_status:-1,_result:t},_init:ee}},h.memo=function(t,a){return{$$typeof:w,type:t,compare:a===void 0?null:a}},h.startTransition=function(t){var a=R.T,x={};R.T=x;try{var f=t(),b=R.S;b!==null&&b(x,f),typeof f=="object"&&f!==null&&typeof f.then=="function"&&f.then(W,te)}catch(_){te(_)}finally{a!==null&&x.types!==null&&(a.types=x.types),R.T=a}},h.unstable_useCacheRefresh=function(){return R.H.useCacheRefresh()},h.use=function(t){return R.H.use(t)},h.useActionState=function(t,a,x){return R.H.useActionState(t,a,x)},h.useCallback=function(t,a){return R.H.useCallback(t,a)},h.useContext=function(t){return R.H.useContext(t)},h.useDebugValue=function(){},h.useDeferredValue=function(t,a){return R.H.useDeferredValue(t,a)},h.useEffect=function(t,a){return R.H.useEffect(t,a)},h.useEffectEvent=function(t){return R.H.useEffectEvent(t)},h.useId=function(){return R.H.useId()},h.useImperativeHandle=function(t,a,x){return R.H.useImperativeHandle(t,a,x)},h.useInsertionEffect=function(t,a){return R.H.useInsertionEffect(t,a)},h.useLayoutEffect=function(t,a){return R.H.useLayoutEffect(t,a)},h.useMemo=function(t,a){return R.H.useMemo(t,a)},h.useOptimistic=function(t,a){return R.H.useOptimistic(t,a)},h.useReducer=function(t,a,x){return R.H.useReducer(t,a,x)},h.useRef=function(t){return R.H.useRef(t)},h.useState=function(t){return R.H.useState(t)},h.useSyncExternalStore=function(t,a,x){return R.H.useSyncExternalStore(t,a,x)},h.useTransition=function(){return R.H.useTransition()},h.version="19.2.8",h}var Ne;function Fe(){return Ne||(Ne=1,xe.exports=Le()),xe.exports}var u=Fe();const Me=ke(u),Pt=$e({__proto__:null,default:Me},[u]);let He={data:""},qe=e=>{if(typeof window=="object"){let r=(e?e.querySelector("#_goober"):window._goober)||Object.assign(document.createElement("style"),{innerHTML:" ",id:"_goober"});return r.nonce=window.__nonce__,r.parentNode||(e||document.head).appendChild(r),r.firstChild}return e||He},Ye=/(?:([\u0080-\uFFFF\w-%@]+) *:? *([^{;]+?);|([^;}{]*?) *{)|(}\s*)/g,ze=/\/\*[^]*?\*\/|  +/g,Ee=/\n+/g,Y=(e,r)=>{let n="",d="",l="";for(let i in e){let c=e[i];i[0]=="@"?i[1]=="i"?n=i+" "+c+";":d+=i[1]=="f"?Y(c,i):i+"{"+Y(c,i[1]=="k"?"":r)+"}":typeof c=="object"?d+=Y(c,r?r.replace(/([^,])+/g,m=>i.replace(/([^,]*:\S+\([^)]*\))|([^,])+/g,y=>/&/.test(y)?y.replace(/&/g,m):m?m+" "+y:y)):i):c!=null&&(i=i[1]=="-"?i:i.replace(/[A-Z]/g,"-$&").toLowerCase(),l+=Y.p?Y.p(i,c):i+":"+c+";")}return n+(r&&l?r+"{"+l+"}":l)+d},q={},_e=e=>{if(typeof e=="object"){let r="";for(let n in e)r+=n+_e(e[n]);return r}return e},Ue=(e,r,n,d,l)=>{let i=_e(e),c=q[i]||(q[i]=(y=>{let w=0,v=11;for(;w<y.length;)v=101*v+y.charCodeAt(w++)>>>0;return"go"+v})(i));if(!q[c]){let y=i!==e?e:(w=>{let v,j,N=[{}];for(;v=Ye.exec(w.replace(ze,""));)v[4]?N.shift():v[3]?(j=v[3].replace(Ee," ").trim(),N.unshift(N[0][j]=N[0][j]||{})):N[0][v[1]]=v[2].replace(Ee," ").trim();return N[0]})(e);q[c]=Y(l?{["@keyframes "+c]:y}:y,n?"":"."+c)}let m=n&&q.g;return n&&(q.g=q[c]),((y,w,v,j)=>{j?w.data=w.data.replace(j,y):w.data.indexOf(y)===-1&&(w.data=v?y+w.data:w.data+y)})(q[c],r,d,m),c},Be=(e,r,n)=>e.reduce((d,l,i)=>{let c=r[i];if(c&&c.call){let m=c(n),y=m&&m.props&&m.props.className||/^go/.test(m)&&m;c=y?"."+y:m&&typeof m=="object"?m.props?"":Y(m,""):m===!1?"":m}return d+l+(c??"")},"");function ce(e){let r=this||{},n=e.call?e(r.p):e;return Ue(n.unshift?n.raw?Be(n,[].slice.call(arguments,1),r.p):n.reduce((d,l)=>Object.assign(d,l&&l.call?l(r.p):l),{}):n,qe(r.target),r.g,r.o,r.k)}let Re,he,ye;ce.bind({g:1});let D=ce.bind({k:1});function Je(e,r,n,d){Y.p=r,Re=e,he=n,ye=d}function z(e,r){let n=this||{};return function(){let d=arguments;function l(i,c){let m=Object.assign({},i),y=m.className||l.className;n.p=Object.assign({theme:he&&he()},m),n.o=/go\d/.test(y),m.className=ce.apply(n,d)+(y?" "+y:"");let w=e;return e[0]&&(w=m.as||e,delete m.as),ye&&w[0]&&ye(m),Re(w,m)}return l}}var Ge=e=>typeof e=="function",le=(e,r)=>Ge(e)?e(r):e,We=(()=>{let e=0;return()=>(++e).toString()})(),Se=(()=>{let e;return()=>{if(e===void 0&&typeof window<"u"){let r=matchMedia("(prefers-reduced-motion: reduce)");e=!r||r.matches}return e}})(),Ze=20,ge="default",Te=(e,r)=>{let{toastLimit:n}=e.settings;switch(r.type){case 0:return{...e,toasts:[r.toast,...e.toasts].slice(0,n)};case 1:return{...e,toasts:e.toasts.map(c=>c.id===r.toast.id?{...c,...r.toast}:c)};case 2:let{toast:d}=r;return Te(e,{type:e.toasts.find(c=>c.id===d.id)?1:0,toast:d});case 3:let{toastId:l}=r;return{...e,toasts:e.toasts.map(c=>c.id===l||l===void 0?{...c,dismissed:!0,visible:!1}:c)};case 4:return r.toastId===void 0?{...e,toasts:[]}:{...e,toasts:e.toasts.filter(c=>c.id!==r.toastId)};case 5:return{...e,pausedAt:r.time};case 6:let i=r.time-(e.pausedAt||0);return{...e,pausedAt:void 0,toasts:e.toasts.map(c=>({...c,pauseDuration:c.pauseDuration+i}))}}},ie=[],Ce={toasts:[],pausedAt:void 0,settings:{toastLimit:Ze}},O={},Pe=(e,r=ge)=>{O[r]=Te(O[r]||Ce,e),ie.forEach(([n,d])=>{n===r&&d(O[r])})},Ae=e=>Object.keys(O).forEach(r=>Pe(e,r)),Qe=e=>Object.keys(O).find(r=>O[r].toasts.some(n=>n.id===e)),de=(e=ge)=>r=>{Pe(r,e)},Xe={blank:4e3,error:4e3,success:2e3,loading:1/0,custom:4e3},Ke=(e={},r=ge)=>{let[n,d]=u.useState(O[r]||Ce),l=u.useRef(O[r]);u.useEffect(()=>(l.current!==O[r]&&d(O[r]),ie.push([r,d]),()=>{let c=ie.findIndex(([m])=>m===r);c>-1&&ie.splice(c,1)}),[r]);let i=n.toasts.map(c=>{var m,y,w;return{...e,...e[c.type],...c,removeDelay:c.removeDelay||((m=e[c.type])==null?void 0:m.removeDelay)||(e==null?void 0:e.removeDelay),duration:c.duration||((y=e[c.type])==null?void 0:y.duration)||(e==null?void 0:e.duration)||Xe[c.type],style:{...e.style,...(w=e[c.type])==null?void 0:w.style,...c.style}}});return{...n,toasts:i}},Ve=(e,r="blank",n)=>({createdAt:Date.now(),visible:!0,dismissed:!1,type:r,ariaProps:{role:"status","aria-live":"polite"},message:e,pauseDuration:0,...n,id:(n==null?void 0:n.id)||We()}),re=e=>(r,n)=>{let d=Ve(r,e,n);return de(d.toasterId||Qe(d.id))({type:2,toast:d}),d.id},T=(e,r)=>re("blank")(e,r);T.error=re("error");T.success=re("success");T.loading=re("loading");T.custom=re("custom");T.dismiss=(e,r)=>{let n={type:3,toastId:e};r?de(r)(n):Ae(n)};T.dismissAll=e=>T.dismiss(void 0,e);T.remove=(e,r)=>{let n={type:4,toastId:e};r?de(r)(n):Ae(n)};T.removeAll=e=>T.remove(void 0,e);T.promise=(e,r,n)=>{let d=T.loading(r.loading,{...n,...n==null?void 0:n.loading});return typeof e=="function"&&(e=e()),e.then(l=>{let i=r.success?le(r.success,l):void 0;return i?T.success(i,{id:d,...n,...n==null?void 0:n.success}):T.dismiss(d),l}).catch(l=>{let i=r.error?le(r.error,l):void 0;i?T.error(i,{id:d,...n,...n==null?void 0:n.error}):T.dismiss(d)}),e};var et=1e3,tt=(e,r="default")=>{let{toasts:n,pausedAt:d}=Ke(e,r),l=u.useRef(new Map).current,i=u.useCallback((j,N=et)=>{if(l.has(j))return;let E=setTimeout(()=>{l.delete(j),c({type:4,toastId:j})},N);l.set(j,E)},[]);u.useEffect(()=>{if(d)return;let j=Date.now(),N=n.map(E=>{if(E.duration===1/0)return;let P=(E.duration||0)+E.pauseDuration-(j-E.createdAt);if(P<0){E.visible&&T.dismiss(E.id);return}return setTimeout(()=>T.dismiss(E.id,r),P)});return()=>{N.forEach(E=>E&&clearTimeout(E))}},[n,d,r]);let c=u.useCallback(de(r),[r]),m=u.useCallback(()=>{c({type:5,time:Date.now()})},[c]),y=u.useCallback((j,N)=>{c({type:1,toast:{id:j,height:N}})},[c]),w=u.useCallback(()=>{d&&c({type:6,time:Date.now()})},[d,c]),v=u.useCallback((j,N)=>{let{reverseOrder:E=!1,gutter:P=8,defaultPosition:L}=N||{},F=n.filter(A=>(A.position||L)===(j.position||L)&&A.height),k=F.findIndex(A=>A.id===j.id),U=F.filter((A,I)=>I<k&&A.visible).length;return F.filter(A=>A.visible).slice(...E?[U+1]:[0,U]).reduce((A,I)=>A+(I.height||0)+P,0)},[n]);return u.useEffect(()=>{n.forEach(j=>{if(j.dismissed)i(j.id,j.removeDelay);else{let N=l.get(j.id);N&&(clearTimeout(N),l.delete(j.id))}})},[n,i]),{toasts:n,handlers:{updateHeight:y,startPause:m,endPause:w,calculateOffset:v}}},st=D`
from {
  transform: scale(0) rotate(45deg);
	opacity: 0;
}
to {
 transform: scale(1) rotate(45deg);
  opacity: 1;
}`,rt=D`
from {
  transform: scale(0);
  opacity: 0;
}
to {
  transform: scale(1);
  opacity: 1;
}`,nt=D`
from {
  transform: scale(0) rotate(90deg);
	opacity: 0;
}
to {
  transform: scale(1) rotate(90deg);
	opacity: 1;
}`,at=z("div")`
  width: 20px;
  opacity: 0;
  height: 20px;
  border-radius: 10px;
  background: ${e=>e.primary||"#ff4b4b"};
  position: relative;
  transform: rotate(45deg);

  animation: ${st} 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
  animation-delay: 100ms;

  &:after,
  &:before {
    content: '';
    animation: ${rt} 0.15s ease-out forwards;
    animation-delay: 150ms;
    position: absolute;
    border-radius: 3px;
    opacity: 0;
    background: ${e=>e.secondary||"#fff"};
    bottom: 9px;
    left: 4px;
    height: 2px;
    width: 12px;
  }

  &:before {
    animation: ${nt} 0.15s ease-out forwards;
    animation-delay: 180ms;
    transform: rotate(90deg);
  }
`,ot=D`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`,it=z("div")`
  width: 12px;
  height: 12px;
  box-sizing: border-box;
  border: 2px solid;
  border-radius: 100%;
  border-color: ${e=>e.secondary||"#e0e0e0"};
  border-right-color: ${e=>e.primary||"#616161"};
  animation: ${ot} 1s linear infinite;
`,lt=D`
from {
  transform: scale(0) rotate(45deg);
	opacity: 0;
}
to {
  transform: scale(1) rotate(45deg);
	opacity: 1;
}`,ct=D`
0% {
	height: 0;
	width: 0;
	opacity: 0;
}
40% {
  height: 0;
	width: 6px;
	opacity: 1;
}
100% {
  opacity: 1;
  height: 10px;
}`,dt=z("div")`
  width: 20px;
  opacity: 0;
  height: 20px;
  border-radius: 10px;
  background: ${e=>e.primary||"#61d345"};
  position: relative;
  transform: rotate(45deg);

  animation: ${lt} 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
  animation-delay: 100ms;
  &:after {
    content: '';
    box-sizing: border-box;
    animation: ${ct} 0.2s ease-out forwards;
    opacity: 0;
    animation-delay: 200ms;
    position: absolute;
    border-right: 2px solid;
    border-bottom: 2px solid;
    border-color: ${e=>e.secondary||"#fff"};
    bottom: 6px;
    left: 6px;
    height: 10px;
    width: 6px;
  }
`,ut=z("div")`
  position: absolute;
`,pt=z("div")`
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  min-width: 20px;
  min-height: 20px;
`,ft=D`
from {
  transform: scale(0.6);
  opacity: 0.4;
}
to {
  transform: scale(1);
  opacity: 1;
}`,mt=z("div")`
  position: relative;
  transform: scale(0.6);
  opacity: 0.4;
  min-width: 20px;
  animation: ${ft} 0.3s 0.12s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
`,xt=({toast:e})=>{let{icon:r,type:n,iconTheme:d}=e;return r!==void 0?typeof r=="string"?u.createElement(mt,null,r):r:n==="blank"?null:u.createElement(pt,null,u.createElement(it,{...d}),n!=="loading"&&u.createElement(ut,null,n==="error"?u.createElement(at,{...d}):u.createElement(dt,{...d})))},ht=e=>`
0% {transform: translate3d(0,${e*-200}%,0) scale(.6); opacity:.5;}
100% {transform: translate3d(0,0,0) scale(1); opacity:1;}
`,yt=e=>`
0% {transform: translate3d(0,0,-1px) scale(1); opacity:1;}
100% {transform: translate3d(0,${e*-150}%,-1px) scale(.6); opacity:0;}
`,gt="0%{opacity:0;} 100%{opacity:1;}",bt="0%{opacity:1;} 100%{opacity:0;}",jt=z("div")`
  display: flex;
  align-items: center;
  background: #fff;
  color: #363636;
  line-height: 1.3;
  will-change: transform;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1), 0 3px 3px rgba(0, 0, 0, 0.05);
  max-width: 350px;
  pointer-events: auto;
  padding: 8px 10px;
  border-radius: 8px;
`,vt=z("div")`
  display: flex;
  justify-content: center;
  margin: 4px 10px;
  color: inherit;
  flex: 1 1 auto;
  white-space: pre-line;
`,wt=(e,r)=>{let n=e.includes("top")?1:-1,[d,l]=Se()?[gt,bt]:[ht(n),yt(n)];return{animation:r?`${D(d)} 0.35s cubic-bezier(.21,1.02,.73,1) forwards`:`${D(l)} 0.4s forwards cubic-bezier(.06,.71,.55,1)`}},Nt=u.memo(({toast:e,position:r,style:n,children:d})=>{let l=e.height?wt(e.position||r||"top-center",e.visible):{opacity:0},i=u.createElement(xt,{toast:e}),c=u.createElement(vt,{...e.ariaProps},le(e.message,e));return u.createElement(jt,{className:e.className,style:{...l,...n,...e.style}},typeof d=="function"?d({icon:i,message:c}):u.createElement(u.Fragment,null,i,c))});Je(u.createElement);var Et=({id:e,className:r,style:n,onHeightUpdate:d,children:l})=>{let i=u.useCallback(c=>{if(c){let m=()=>{let y=c.getBoundingClientRect().height;d(e,y)};m(),new MutationObserver(m).observe(c,{subtree:!0,childList:!0,characterData:!0})}},[e,d]);return u.createElement("div",{ref:i,className:r,style:n},l)},_t=(e,r)=>{let n=e.includes("top"),d=n?{top:0}:{bottom:0},l=e.includes("center")?{justifyContent:"center"}:e.includes("right")?{justifyContent:"flex-end"}:{};return{left:0,right:0,display:"flex",position:"absolute",transition:Se()?void 0:"all 230ms cubic-bezier(.21,1.02,.73,1)",transform:`translateY(${r*(n?1:-1)}px)`,...d,...l}},Rt=ce`
  z-index: 9999;
  > * {
    pointer-events: auto;
  }
`,oe=16,St=({reverseOrder:e,position:r="top-center",toastOptions:n,gutter:d,children:l,toasterId:i,containerStyle:c,containerClassName:m})=>{let{toasts:y,handlers:w}=tt(n,i);return u.createElement("div",{"data-rht-toaster":i||"",style:{position:"fixed",zIndex:9999,top:oe,left:oe,right:oe,bottom:oe,pointerEvents:"none",...c},className:m,onMouseEnter:w.startPause,onMouseLeave:w.endPause},y.map(v=>{let j=v.position||r,N=w.calculateOffset(v,{reverseOrder:e,gutter:d,defaultPosition:r}),E=_t(j,N);return u.createElement(Et,{id:v.id,key:v.id,onHeightUpdate:w.updateHeight,className:v.visible?Rt:"",style:E},v.type==="custom"?le(v.message,v):l?l(v):u.createElement(Nt,{toast:v,position:j}))}))},Tt=T;const Ct=({transaction:e,onClose:r})=>s.jsx("div",{className:"fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4",children:s.jsxs("div",{className:"bg-slate-800 p-6 rounded-lg shadow-xl w-full max-w-md relative border border-slate-700",children:[s.jsx("button",{onClick:r,className:"absolute top-3 right-3 text-gray-400 hover:text-gray-200 text-2xl",children:"×"}),s.jsx("h3",{className:"text-2xl font-bold text-purple-400 mb-4",children:"Transaction Details"}),s.jsxs("div",{className:"space-y-3 text-slate-300",children:[s.jsxs("p",{children:[s.jsx("strong",{children:"ID:"})," ",s.jsx("span",{className:"font-mono text-sm",children:e.id})]}),s.jsxs("p",{children:[s.jsx("strong",{children:"Type:"})," ",s.jsx("span",{className:`font-semibold ${e.type==="PlayerDeposit"||e.type==="deposit"?"text-green-400":"text-red-400"}`,children:e.type})]}),s.jsxs("p",{children:[s.jsx("strong",{children:"Amount:"})," ",s.jsxs("span",{className:"font-mono",children:["$",e.amount.toFixed(2)]})]}),e.discountAmount&&s.jsxs("p",{children:[s.jsx("strong",{children:"Discount:"})," ",s.jsxs("span",{className:"font-mono",children:["$",e.discountAmount.toFixed(2)]})]}),s.jsxs("p",{children:[s.jsx("strong",{children:"Date:"})," ",new Date(e.timestamp).toLocaleString()]}),e.description&&s.jsxs("p",{children:[s.jsx("strong",{children:"Description:"})," ",e.description]}),e.playerId&&s.jsxs("p",{children:[s.jsx("strong",{children:"Player ID:"})," ",s.jsx("span",{className:"font-mono text-sm",children:e.playerId})]}),e.playerName&&s.jsxs("p",{children:[s.jsx("strong",{children:"Player Name:"})," ",e.playerName]}),e.agentId&&s.jsxs("p",{children:[s.jsx("strong",{children:"Agent ID:"})," ",s.jsx("span",{className:"font-mono text-sm",children:e.agentId})]})]})]})}),At=()=>{const[e,r]=u.useState(null),[n,d]=u.useState(!1),[l,i]=u.useState(null),[c,m]=u.useState(""),[y,w]=u.useState(""),[v,j]=u.useState([]),[N,E]=u.useState(!0),[P,L]=u.useState(""),[F,k]=u.useState([]),[U,A]=u.useState([]),[I,G]=u.useState(1),[W,R]=u.useState(new Set),[K,Z]=u.useState(null),[ne,V]=u.useState(""),[ue,Q]=u.useState(0),[B,pe]=u.useState([]);u.useEffect(()=>{if(e&&P){const o=parseFloat(P);if(!isNaN(o)&&o>0){const p=o*(1-e.commissionRate);Q(p)}else Q(0)}else Q(0)},[P,e]);const M=async()=>{try{const o=await fetch("/api/agent/payment-instructions");if(!o.ok){console.error("Could not fetch payment instructions");return}const p=await o.json();V(p.instructions)}catch(o){console.error("Error fetching payment instructions:",o)}},J=async o=>{try{const p=await fetch(`/api/agent/my-players?agentId=${o}`);if(!p.ok)throw new Error("Failed to fetch linked players");const g=await p.json();pe(g)}catch(p){console.error(p.message)}},ee=10,te=I*ee,fe=te-ee,t=v.slice(fe,te),a=Math.ceil(v.length/ee),x=async o=>{try{const p=await fetch(`/api/agent/requests?agentId=${o}`);if(!p.ok)throw new Error("Failed to fetch agent requests");const g=await p.json();k(g)}catch(p){i(p.message)}},f=async o=>{try{const p=await fetch(`/api/agent/player-requests?agentId=${o}`);if(!p.ok)throw new Error("Failed to fetch player requests");const g=await p.json(),H=new Set(g.filter(X=>X.status==="pending").map(X=>X.id));if(W.size>0){const X=[...H].filter(Ie=>!W.has(Ie));X.length>0&&Tt.success(`You have ${X.length} new player transaction request(s)!`)}R(H),A(g)}catch(p){console.error(p.message)}},b=async o=>{const p=localStorage.getItem("agentId");if(p){E(!0);try{const g=await fetch(`/api/agent/player-requests/${o}/approve?agentId=${p}`,{method:"POST"}),H=await g.json();if(!g.ok)throw new Error(H.error||"Failed to approve request");await f(p),await be(p)}catch(g){i(g.message)}finally{E(!1)}}},_=async o=>{const p=localStorage.getItem("agentId");if(p){E(!0);try{const g=await fetch(`/api/agent/player-requests/${o}/reject?agentId=${p}`,{method:"POST"}),H=await g.json();if(!g.ok)throw new Error(H.error||"Failed to reject request");await f(p)}catch(g){i(g.message)}finally{E(!1)}}},S=async o=>{o.preventDefault();const p=localStorage.getItem("agentId");if(!P||parseFloat(P)<=0||!p){i("Please enter a valid amount to request.");return}E(!0),i(null);try{const g=await fetch(`/api/agent/request-float?agentId=${p}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({amount:P})}),H=await g.json();if(!g.ok)throw new Error(H.error||"Float request failed");alert(`Success! Your request for $${P} has been submitted.`),await x(p),L("")}catch(g){i(g.message)}finally{E(!1)}},$=async o=>{o.preventDefault(),E(!0),i(null);try{const p=await fetch("/api/agent/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({username:c,password:y})}),g=await p.json();if(!p.ok)throw new Error(g.error||"Login failed");localStorage.setItem("agentId",g.agent.id),r(g.agent),d(!0),await ae(g.agent.id),await x(g.agent.id),await J(g.agent.id)}catch(p){i(p.message)}finally{E(!1)}},C=()=>{localStorage.removeItem("agentId"),d(!1),r(null),j([]),m(""),w("")},ae=async o=>{try{const p=await fetch(`/api/agent/transactions?agentId=${o}`);if(!p.ok)throw new Error("Failed to fetch transactions");const g=await p.json();j(g)}catch(p){i(p.message)}},be=async o=>{E(!0);try{const p=await fetch(`/api/agent/profile?agentId=${o}`);if(!p.ok)throw C(),new Error("Session expired or invalid.");const g=await p.json();r(g),d(!0),await ae(g.id),await x(g.id),await M(),await J(g.id)}catch(p){i(p.message)}finally{E(!1)}};return u.useEffect(()=>{const o=localStorage.getItem("agentId");o?be(o):E(!1)},[]),u.useEffect(()=>{const o=e==null?void 0:e.id;if(n&&o){f(o);const p=setInterval(()=>{f(o)},5e3);return()=>clearInterval(p)}},[n,e==null?void 0:e.id]),N&&!n?s.jsx("div",{className:"h-screen bg-gray-900 text-white flex items-center justify-center",children:s.jsx("div",{children:"Loading..."})}):!n||!e?s.jsx("div",{className:"min-h-screen bg-slate-900 flex items-center justify-center",children:s.jsxs("div",{className:"w-full max-w-sm p-6 bg-slate-800 border border-slate-700 rounded-xl",children:[s.jsx("h1",{className:"text-2xl font-bold text-center text-purple-400",children:"Agent Login"}),s.jsxs("form",{onSubmit:$,className:"mt-4",children:[s.jsxs("div",{className:"mb-4",children:[s.jsx("label",{className:"block text-gray-400 mb-2",htmlFor:"username",children:"Username"}),s.jsx("input",{id:"username",type:"text",value:c,onChange:o=>m(o.target.value),placeholder:"Enter Username",className:"w-full bg-slate-700 p-2 rounded-lg border border-slate-600",required:!0})]}),s.jsxs("div",{className:"mb-6",children:[s.jsx("label",{className:"block text-gray-400 mb-2",htmlFor:"password",children:"Password"}),s.jsx("input",{id:"password",type:"password",value:y,onChange:o=>w(o.target.value),placeholder:"Enter Password",className:"w-full bg-slate-700 p-2 rounded-lg border border-slate-600",required:!0})]}),l&&s.jsx("p",{className:"mt-4 text-center text-red-400",children:l}),s.jsx("button",{type:"submit",disabled:N,className:"w-full bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg font-bold disabled:bg-slate-500",children:N?"Logging in...":"Login"})]})]})}):s.jsxs("div",{className:"bg-slate-900 text-white min-h-screen p-4 md:p-8",children:[s.jsx(St,{}),s.jsxs("div",{className:"max-w-4xl mx-auto",children:[s.jsxs("div",{className:"flex justify-between items-center",children:[s.jsx("h1",{className:"text-3xl font-bold text-purple-400",children:"Agent Dashboard"}),s.jsx("button",{onClick:C,className:"text-sm text-red-400 hover:underline",children:"Logout"})]}),s.jsxs("div",{className:"mt-4 text-lg",children:["Welcome, ",s.jsx("span",{className:"font-bold",children:e==null?void 0:e.username}),"!"]}),s.jsxs("div",{className:"grid md:grid-cols-2 gap-4 mt-2",children:[s.jsxs("div",{className:"p-4 bg-green-800/50 border border-green-500 rounded-xl",children:["Float Balance: ",s.jsxs("span",{className:"font-mono text-2xl font-bold",children:["$",e==null?void 0:e.floatBalance.toFixed(2)]})]}),e.promoCode&&s.jsxs("div",{className:"p-4 bg-indigo-800/50 border border-indigo-500 rounded-xl flex flex-col justify-center items-center",children:[s.jsx("span",{className:"text-sm uppercase tracking-widest text-indigo-300",children:"Your Promo Code"}),s.jsx("span",{className:"font-mono text-2xl font-bold tracking-wider",children:e.promoCode})]})]}),l&&s.jsx("div",{className:"mt-4 p-3 bg-red-800/50 border border-red-500 rounded-xl text-white",children:l}),s.jsxs("div",{className:"mt-8 p-6 bg-slate-800 border border-slate-700 rounded-xl",children:[s.jsxs("h2",{className:"text-2xl font-semibold",children:["My Linked Players (",B.length,")"]}),s.jsx("div",{className:"mt-4 overflow-x-auto",children:s.jsxs("table",{className:"w-full text-sm text-left",children:[s.jsx("thead",{className:"bg-slate-700 text-xs text-slate-300 uppercase",children:s.jsxs("tr",{children:[s.jsx("th",{className:"px-4 py-3",children:"Player"}),s.jsx("th",{className:"px-4 py-3 text-right",children:"Balance"})]})}),s.jsxs("tbody",{children:[B.map(o=>s.jsxs("tr",{className:"border-b border-slate-700 last:border-b-0",children:[s.jsxs("td",{className:"px-4 py-3 font-medium flex items-center gap-2",children:[s.jsx("span",{className:"text-xl",children:o.avatar}),o.username]}),s.jsxs("td",{className:"px-4 py-3 font-mono text-right",children:["$",o.balance.toFixed(2)]})]},o.id)),B.length===0&&s.jsx("tr",{children:s.jsx("td",{colSpan:2,className:"px-4 py-6 text-center text-slate-400 italic",children:"No players have signed up with your promo code yet."})})]})]})})]}),s.jsxs("div",{className:"mt-8 p-6 bg-slate-800 border border-slate-700 rounded-xl",children:[s.jsx("h2",{className:"text-2xl font-semibold",children:"Player Transaction Requests"}),s.jsx("div",{className:"mt-4 overflow-x-auto",children:s.jsxs("table",{className:"w-full text-sm text-left",children:[s.jsx("thead",{className:"bg-slate-700 text-xs text-slate-300 uppercase",children:s.jsxs("tr",{children:[s.jsx("th",{className:"px-4 py-3",children:"Date"}),s.jsx("th",{className:"px-4 py-3",children:"Player"}),s.jsx("th",{className:"px-4 py-3",children:"Phone"}),s.jsx("th",{className:"px-4 py-3",children:"Type"}),s.jsx("th",{className:"px-4 py-3 text-right",children:"Amount"}),s.jsx("th",{className:"px-4 py-3 text-center",children:"Status"}),s.jsx("th",{className:"px-4 py-3 text-center",children:"Actions"})]})}),s.jsx("tbody",{children:U.map(o=>s.jsxs("tr",{className:"border-b border-slate-700 last:border-b-0",children:[s.jsx("td",{className:"px-4 py-3 text-slate-400",children:new Date(o.createdAt).toLocaleString()}),s.jsxs("td",{className:"px-4 py-3 font-medium flex items-center gap-2",children:[s.jsx("span",{className:"text-xl",children:o.playerAvatar}),o.playerUsername]}),s.jsx("td",{className:"px-4 py-3 font-mono",children:o.type==="deposit"?o.senderPhone:o.playerPhone}),s.jsx("td",{className:"px-4 py-3",children:s.jsx("span",{className:`font-semibold ${o.type==="deposit"?"text-green-400":"text-red-400"}`,children:o.type.toUpperCase()})}),s.jsxs("td",{className:"px-4 py-3 font-mono text-right",children:["$",o.amount.toFixed(2)]}),s.jsx("td",{className:"px-4 py-3 text-center",children:s.jsx("span",{className:`px-2 py-1 rounded-full text-xs font-semibold ${o.status==="pending"?"bg-yellow-900 text-yellow-200":o.status==="approved"?"bg-green-900 text-green-200":"bg-red-900 text-red-200"}`,children:o.status})}),s.jsx("td",{className:"px-4 py-3 text-center",children:o.status==="pending"&&s.jsxs("div",{className:"flex gap-2 justify-center",children:[s.jsx("button",{onClick:()=>b(o.id),disabled:N,className:"bg-green-600 hover:bg-green-700 px-3 py-1 rounded font-bold text-xs disabled:bg-slate-500",children:"Approve"}),s.jsx("button",{onClick:()=>_(o.id),disabled:N,className:"bg-red-600 hover:bg-red-700 px-3 py-1 rounded font-bold text-xs disabled:bg-slate-500",children:"Reject"})]})})]},o.id))})]})})]}),s.jsxs("div",{className:"mt-8 p-6 bg-slate-800 border border-slate-700 rounded-xl",children:[s.jsx("h2",{className:"text-2xl font-semibold",children:"Request Float"}),s.jsx("form",{onSubmit:S,className:"mt-4",children:s.jsxs("div",{className:"flex gap-2",children:[s.jsx("input",{type:"number",value:P,onChange:o=>L(o.target.value),placeholder:"Enter amount to request",className:"flex-grow bg-slate-700 p-2 rounded-lg border border-slate-600",required:!0}),s.jsx("button",{type:"submit",disabled:N,className:"bg-purple-600 hover:bg-purple-700 px-5 py-2 rounded-lg font-bold disabled:bg-slate-500",children:N?"Submitting...":"Submit Request"})]})}),s.jsxs("div",{className:"mt-4 p-4 bg-slate-700 rounded-lg",children:[s.jsx("h3",{className:"text-lg font-semibold text-purple-400",children:"Payment Instructions"}),ne?s.jsx("p",{className:"text-slate-300 whitespace-pre-wrap",children:ne}):s.jsx("p",{className:"text-slate-400 italic",children:"No payment instructions available. Please contact an admin to have them set up."})]}),s.jsxs("div",{className:"mt-4 bg-gray-700 p-3 rounded-lg space-y-2",children:[s.jsxs("div",{className:"flex justify-between text-sm",children:[s.jsx("span",{className:"text-gray-400",children:"Your Commission Rate:"}),s.jsxs("span",{className:"text-white font-mono",children:[(e.commissionRate*100).toFixed(2),"%"]})]}),s.jsxs("div",{className:"flex justify-between text-lg font-bold",children:[s.jsx("span",{className:"text-purple-400",children:"Cash You Send to Admin:"}),s.jsxs("span",{className:"text-purple-400 font-mono",children:["$",ue.toFixed(2)]})]})]})]}),s.jsxs("div",{className:"mt-8",children:[s.jsx("h2",{className:"text-2xl font-semibold",children:"Transaction History"}),s.jsx("div",{className:"mt-4 bg-slate-800 border border-slate-700 rounded-xl overflow-hidden",children:s.jsxs("table",{className:"w-full text-sm text-left",children:[s.jsx("thead",{className:"bg-slate-700 text-xs text-slate-300 uppercase",children:s.jsxs("tr",{children:[s.jsx("th",{className:"px-4 py-3",children:"Date"}),s.jsx("th",{className:"px-4 py-3",children:"Type"}),s.jsx("th",{className:"px-4 py-3",children:"Description"}),s.jsx("th",{className:"px-4 py-3 text-right",children:"Amount"})]})}),s.jsx("tbody",{children:t.map(o=>s.jsxs("tr",{className:"border-b border-slate-700 last:border-b-0 cursor-pointer hover:bg-slate-700",onClick:()=>Z(o),children:[s.jsx("td",{className:"px-4 py-3 text-slate-400",children:new Date(o.timestamp).toLocaleString()}),s.jsx("td",{className:"px-4 py-3",children:s.jsx("span",{className:`px-2 py-1 rounded-full text-xs font-semibold ${o.type==="PlayerDeposit"||o.type==="FloatPurchase"?"bg-blue-900 text-blue-200":o.type==="PlayerWithdrawal"?"bg-yellow-900 text-yellow-200":"bg-green-900 text-green-200"}`,children:o.type})}),s.jsx("td",{className:"px-4 py-3",children:o.description}),s.jsxs("td",{className:`px-4 py-3 font-mono text-right ${o.type==="PlayerDeposit"?"text-red-400":"text-green-400"}`,children:[o.type==="PlayerDeposit"?"-":"+","$",o.amount.toFixed(2)]})]},o.id))})]})}),a>1&&s.jsxs("div",{className:"mt-4 flex justify-center items-center gap-2",children:[s.jsx("button",{onClick:()=>G(o=>Math.max(o-1,1)),disabled:I===1,className:"px-3 py-1 bg-slate-700 rounded disabled:opacity-50",children:"«"}),Array.from({length:a},(o,p)=>p+1).map(o=>s.jsx("button",{onClick:()=>G(o),className:`px-3 py-1 rounded ${I===o?"bg-purple-600":"bg-slate-700"}`,children:o},o)),s.jsx("button",{onClick:()=>G(o=>Math.min(o+1,a)),disabled:I===a,className:"px-3 py-1 bg-slate-700 rounded disabled:opacity-50",children:"»"})]})]}),s.jsxs("div",{className:"mt-8",children:[s.jsx("h2",{className:"text-2xl font-semibold",children:"My Float Requests"}),s.jsx("div",{className:"mt-4 bg-slate-800 border border-slate-700 rounded-xl overflow-hidden",children:s.jsxs("table",{className:"w-full text-sm text-left",children:[s.jsx("thead",{className:"bg-slate-700 text-xs text-slate-300 uppercase",children:s.jsxs("tr",{children:[s.jsx("th",{className:"px-4 py-3",children:"Date"}),s.jsx("th",{className:"px-4 py-3",children:"Amount"}),s.jsx("th",{className:"px-4 py-3",children:"Status"})]})}),s.jsx("tbody",{children:F.map(o=>s.jsxs("tr",{className:"border-b border-slate-700 last:border-b-0",children:[s.jsx("td",{className:"px-4 py-3 text-slate-400",children:new Date(o.createdAt).toLocaleString()}),s.jsxs("td",{className:"px-4 py-3 font-mono",children:["$",o.amount.toFixed(2)]}),s.jsx("td",{className:"px-4 py-3",children:s.jsx("span",{className:`px-2 py-1 rounded-full text-xs font-semibold ${o.status==="pending"?"bg-yellow-900 text-yellow-200":o.status==="approved"?"bg-green-900 text-green-200":"bg-red-900 text-red-200"}`,children:o.status})})]},o.id))})]})})]})]}),K&&s.jsx(Ct,{transaction:K,onClose:()=>Z(null)})]})};export{At as A,St as F,Pt as R,u as a,Me as b,ke as g,s as j,T as n,Fe as r,Tt as z};
