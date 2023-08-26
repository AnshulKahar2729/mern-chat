import React, { useContext } from 'react'
import RegisterAndLoginForm from './RegisterAndLoginForm'
import { UserContext } from './UserContext'
import Chat from './Chat';

const Routes = () => {
    const {ctxUsername, ctxId} = useContext(UserContext);

    if(ctxUsername && ctxId){
        return <Chat/>
    }
  return (
    <>
       <RegisterAndLoginForm/>
    </>
  )
}

export default Routes
