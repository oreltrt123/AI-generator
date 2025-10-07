"use client"
import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { useUser } from '@clerk/nextjs';
import { UserDetailContext } from '../context/UserDetailContext';  // Adjust path as needed

function Provider({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
    const {user}=useUser();
    const [userDetail, setUerDetail]=useState<any>();
    useEffect(()=>{
       user && CreateNewUser();
    },[user])
    const CreateNewUser= async()=>{
    const result=await axios.post('/api/users', {
    })
    console.log(result.data)
    setUerDetail(result.data?.user);
    }
  return (
    <div>
        <UserDetailContext.Provider value={{userDetail, setUerDetail}}>
        {children}
        </UserDetailContext.Provider>
    </div>
  )
}

export default Provider