import { db } from "@/config/db";
import { usersTable } from "@/config/schema";
import { currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { User2Icon } from "lucide-react";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const user = await currentUser();
  // If User Already Exists?
  const userResult = await db.select().from(usersTable)
  //@ts-ignore
    .where(eq(usersTable.email,user?.primaryEmailAddress?.emailAddress));

    if(userResult?.length==0){
        const data= {
            name:user?.fullName??'NA',
            email:user?.primaryEmailAddress?.emailAddress??'',
            credits:2
        }
        const result=await db.insert(usersTable).values({
            ...data
        })
        return NextResponse.json({ user: data });
    }
  // If Not Then insert new user
  return NextResponse.json({ user: userResult[0] });
}