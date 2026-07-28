"use client";

import { Input } from "@/components/ui/input";
import React, { useCallback, useEffect } from "react";
import { Project } from "../../../feature/projects/types/index";
import ProjectItem from "@/feature/projects/components/ProjectItem";
import { Button } from "@/components/ui/button";
import CreateProject from "@/feature/projects/components/CreateProject";
import { getProjects } from "@/feature/projects/api/projects.api";
import ApiError from "@/shared/api/ApiError";
import { toast } from "sonner";

const Projects = () => {
  const [search, setSearch] = React.useState("");
  const [projects, setProjects] = React.useState([] as Project[]);
  const [open, setOpen] = React.useState(false);

  const fetchProjects = useCallback(async () => {
    try {
      const response = await getProjects();
      console.log("Fetched projects:", response.projects);
      setProjects(response.projects);
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.message || "Failed to fetch projects");
      }
      console.error("Error fetching projects:", error);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchProjects();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [fetchProjects]);

  let filteredProjects = [];
  if (search.trim() !== "") {
    filteredProjects = projects.filter((project) =>
      project.name.toLowerCase().includes(search.toLowerCase().trim()),
    );
  } else {
    filteredProjects = projects;
  }

  return (
    <div>
      <CreateProject
        open={open}
        setOpen={setOpen}
        onCreated={fetchProjects}
      />

      <p>{filteredProjects.length} projects found</p>
      <Input
        onChange={(e) => setSearch(e.target.value)}
        value={search}
        type="text"
        placeholder="Search projects..."
        className="mb-4 p-2 border rounded"
      />

      <Button
        onClick={() => setOpen(true)}
        className="ml-auto"
      >
        Add Project
      </Button>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProjects.length > 0 ? (
          filteredProjects.map((project) => (
            <ProjectItem
              key={project.id}
              project={project}
              onChanged={fetchProjects}
            />
          ))
        ) : (
          <p className="text-neutral-500 text-sm">No Projects Available</p>
        )}{" "}
      </div>
    </div>
  );
};

export default Projects;
