"use client";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
} from "@/components/ui/sidebar";
import Link from "next/link";
import Image from "next/image";
import { useContext, useEffect, useState } from "react";
import { UserDetailContext } from "../../../context/UserDetailContext";
import { Progress } from "@/components/ui/progress";
import { UserButton } from "@clerk/nextjs";
import axios from "axios";

export function AppSidebar() {
  const [projectList, setProjectList] = useState([]);
  const { userDetail, setUserDetail } = useContext(UserDetailContext);

  useEffect(() => {
    GetProjectList();
  }, []);

  const GetProjectList = async () => {
    const result = await axios.get('/api/get-all-projects');
    setProjectList(result.data);
  };

  if (!userDetail) {
    return (
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2">
            <Image src={'/logo.svg'} alt="logo" width={35} height={35} />
            <h2 className="font-bold text-xl">AIweb</h2>
          </div>
          <Link href={'/workspace'} className="mt-5 w-full">
            <Button className="w-full">+ Add New Project</Button>
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Projects</SidebarGroupLabel>
            {projectList.length === 0 ? (
              <h2 className="text-sm px-2 text-gray-500">No Project Found</h2>
            ) : (
              projectList.map((project: any) => (
                <Link
                  key={project.projectId}
                  href={`/project/${project.projectId}`}
                  className="w-full"
                >
                  <Button variant="ghost" className="w-full justify-start my-1">
                    Project {project.projectId}
                  </Button>
                </Link>
              ))
            )}
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <div className="p-4 text-center text-muted-foreground">
            Loading user details...
          </div>
          <div>
            <UserButton />
          </div>
        </SidebarFooter>
      </Sidebar>
    );
  }

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2">
          <Image src={'/logo.svg'} alt="logo" width={140} height={140} />
        </div>
        <Link href={'/workspace'} className="mt-5 w-full">
          <Button className="w-full">+ Add New Project</Button>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Projects</SidebarGroupLabel>
          {projectList.length === 0 ? (
            <h2 className="text-sm px-2 text-gray-500">No Project Found</h2>
          ) : (
            projectList.map((project: any) => (
              <Link
                key={project.projectId}
                href={`/playground/${project.projectId}`}
                className="w-full"
              >
                <Button variant="ghost" className="w-full justify-start my-1">
                  {project.projectId}
                </Button>
              </Link>
            ))
          )}
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="p-3 border rounded-xl space-y-3 bg-secondary">
          <h2 className="flex justify-between items-center">
            Remaining Credits <span className="font-bold">{userDetail.credits}</span>
          </h2>
          <Progress value={33} />
          <Button className="w-full">
            Upgrade to Unlimited
          </Button>
        </div>
        <div>
          <UserButton />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}