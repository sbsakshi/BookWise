import NextAuth,{User} from "next-auth";

import {compare} from "bcryptjs"
import CredentialsProvider from 'next-auth/providers/credentials'
import { users } from "./database/schema";
import { db } from "./database/drizzle";
import { eq } from "drizzle-orm";


export const {handlers,signIn,signOut,auth}=NextAuth({
    session:{
    strategy :"jwt" , 
},
    providers:[
        CredentialsProvider({
            async authorize(credentials){
                if(!credentials?.email || !credentials?.password){
throw new Error("Missing email or password");               
 }
            const user =await db.select().from(users).where(eq(users.email,credentials.email.toString())).limit(1);

            if(user.length==0){
                throw new Error("User not found");
            } 

            const isPasswordValid = await compare(
                credentials.password.toString(),
                user[0].password,
            );

            if(!isPasswordValid) {
                throw new Error("Invalid password"); 
            }

            return{
                    id:user[0].id.toString(),
                    email:user[0].email,
                    name:user[0].fullName
            } as User;
            }
        })
    ],
    pages:{
        signIn:"/sign-in",
    },
    callbacks:{
        async jwt({token,user}){
            if(user){
                token.id=user.id;
                token.name=user.name;
            }

            return token;
        },
        async session({session,token}){
            if(session.user){
                session.user.id=token.id as string;
                session.user.name=token.name as string;
            }
            return session;
        },
    }
})