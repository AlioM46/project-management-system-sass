"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { createProject } from "../api/projects.api";
import ApiError from "@/shared/api/ApiError";

interface CreateProjectProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  onCreated: () => Promise<void> | void;
}

const CreateProject = ({ open, setOpen, onCreated }: CreateProjectProps) => {
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);

  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
    >
      <DialogContent className="sm:max-w-[425px] bg-neutral-900 border-neutral-800 text-white">
        <DialogHeader>
          <DialogTitle>Create New Course</DialogTitle>
          <DialogDescription className="text-neutral-400">
            Add a new training program to your academy branch workspace.
          </DialogDescription>
        </DialogHeader>

        {/* محتوى الاستمارة (Form) الخاص بالدورة الجديدة يوضع هنا لاحقاً بالباك إند */}
        <div className="grid gap-4 py-4">
          <form
            onSubmit={async (e) => {
              e.preventDefault();

              try {
                if (name.trim() === "") {
                  toast.error("Project name is required");
                  return;
                }

                setIsLoading(true);
                const response = await createProject({
                  name,
                  description,
                });

                if (response) {
                  await onCreated();
                  toast.success("Project created successfully");
                  setOpen(false);
                  setName("");
                  setDescription("");
                }
              } catch (err) {
                if (err instanceof ApiError) {
                  toast.error(err.message);
                }
              } finally {
                setIsLoading(false);
              }
            }}
          >
            <Label htmlFor="project-name">Project Name</Label>
            <Input
              type="text"
              placeholder="Project Name"
              onChange={(e) => {
                setName(e.target.value);
              }}
              value={name}
            />

            <Label htmlFor="project-description">Project Description</Label>
            <Input
              type="text"
              placeholder="Project Description (...Optional)"
              onChange={(e) => {
                setDescription(e.target.value);
              }}
              value={description}
            />

            <Button
              variant={"secondary"}
              disabled={isLoading}
              type="submit"
            >
              Create
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateProject;
