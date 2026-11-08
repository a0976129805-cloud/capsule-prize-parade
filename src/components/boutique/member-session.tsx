import { createContext,useContext } from 'react';
export const MemberContext=createContext<{userId:string|null;ready:boolean}>({userId:null,ready:false});
export const useMember=()=>useContext(MemberContext);