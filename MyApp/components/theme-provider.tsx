import {createContext,useContext,useEffect,useMemo,useState,type ReactNode} from 'react';
import {Platform,StyleSheet,useColorScheme} from 'react-native';
import * as SecureStore from 'expo-secure-store';
export type ThemeMode='system'|'light'|'dark';
const palettes={light:{background:'#F1F5F9',card:'#FFFFFF',text:'#0F172A',muted:'#64748B',border:'#E2E8F0',input:'#F8FAFC',primary:'#2563EB',subtle:'#EFF6FF'},dark:{background:'#0B1220',card:'#111C2E',text:'#FFFFFF',muted:'#FFFFFF',border:'#263449',input:'#0B1628',primary:'#7CABFF',subtle:'#182A46'}};
type Palette=typeof palettes.light;type Value={mode:ThemeMode;isDark:boolean;colors:Palette;setMode:(m:ThemeMode)=>void};
const C=createContext<Value|null>(null),KEY='smartcampus-theme-mode';
export function ThemeProvider({children}:{children:ReactNode}){const sys=useColorScheme();const[mode,setM]=useState<ThemeMode>('system');useEffect(()=>{let ok=true;const load=async()=>{try{const x=Platform.OS==='web'?localStorage.getItem(KEY):await SecureStore.getItemAsync(KEY);if(ok&&(x==='system'||x==='light'||x==='dark'))setM(x)}catch{}};void load();return()=>{ok=false}},[]);const setMode=(m:ThemeMode)=>{setM(m);try{const p=Platform.OS==='web'?Promise.resolve().then(()=>localStorage.setItem(KEY,m)):SecureStore.setItemAsync(KEY,m);void p.catch(()=>{})}catch{}};const isDark=mode==='dark'||(mode==='system'&&sys==='dark'),colors=isDark?palettes.dark:palettes.light;const value=useMemo(()=>({mode,isDark,colors,setMode}),[mode,isDark]);return <C.Provider value={value}>{children}</C.Provider>}
export function useAppTheme(){const x=useContext(C);if(!x)throw Error('ThemeProvider missing');return x}
function adaptDarkColor(property:string, value:unknown):unknown {
  if (typeof value !== 'string' || !/^#[0-9a-f]{3,8}$/i.test(value)) return value;
  const hex=value.length===4 ? '#' + [...value.slice(1)].map(ch=>ch+ch).join('') : value;
  if (hex.length!==7) return value;
  const channels=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));
  const [r,g,b]=channels;
  const luminance=(0.2126*r+0.7152*g+0.0722*b)/255;
  const max=Math.max(r,g,b), min=Math.min(r,g,b), saturation=max===0?0:(max-min)/max;
  if (property==='backgroundColor') {
    if (luminance>0.94 && saturation<0.16) return '#142033';
    if (luminance>0.72 && saturation<0.3) return '#111C2E';
    if (luminance>0.62 && saturation>=0.3 && b>=r && b>=g) return '#1A2B45';
    if (luminance>0.62 && saturation>=0.3 && g>=r && g>=b) return '#19302C';
    if (luminance>0.62 && saturation>=0.3 && r>=g && g>=b) return '#332A1D';
    if (luminance>0.62 && saturation>=0.3 && r>=b && b>g) return '#33222D';
    if (luminance>0.72 && b>=r) return '#1A2B45';
    if (luminance>0.72 && g>r*1.08) return '#19302C';
    if (luminance>0.72 && r>g*1.12) return '#332526';
    return value;
  }
  if (property==='borderColor' && luminance>0.48) return '#2A3A52';
  if (property==='color') return '#FFFFFF';
  return value;
}

export function useAdaptiveStyles<T extends object>(base:T):T {
  const {isDark}=useAppTheme();
  return useMemo(()=>{
    if(!isDark) return base;
    const adapted:Record<string,unknown>={};
    for(const [name,style] of Object.entries(base)) {
      const flat=StyleSheet.flatten(style as never) as Record<string,unknown>;
      const next:Record<string,unknown>={...flat};
      for(const property of ['backgroundColor','borderColor','color']) {
        if(property in next) next[property]=adaptDarkColor(property,next[property]);
      }
      adapted[name]=next;
    }
    return StyleSheet.create(adapted as never) as T;
  },[base,isDark]);
}