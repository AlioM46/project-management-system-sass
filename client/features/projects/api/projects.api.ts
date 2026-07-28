import { apiClient } from "@/shared/api/apiClient";
import { Course, CreateCourseInput, Project, UpdateCourseInput } from "../types";

function mapCourse(course: any): Course {
    return {
        ...course,
        status: "active",
    };
}

export async function getCourses(): Promise<{ courses: Course[] }> {
    const response = await apiClient.get<{ courses: Course[] }>("/courses");
    return {
        courses: (response.courses || []).map(mapCourse),
    };
}

export async function getProjects(): Promise<{ projects: Project[] }> {
    const response = await getCourses();
    return { projects: response.courses };
}

export async function getCourse(courseId: string): Promise<Course> {
    const response = await apiClient.get<{ course: Course }>(`/courses/${courseId}`);
    return mapCourse(response.course || response);
}

export async function getProject(projectId: string): Promise<Project> {
    return getCourse(projectId);
}

export async function createCourse(data: CreateCourseInput): Promise<Course> {
    const response = await apiClient.post<{ course: Course }>("/courses", data);
    return mapCourse(response.course || response);
}

export async function createProject(data: CreateCourseInput): Promise<Project> {
    return createCourse(data);
}

export async function updateCourse(courseId: string, data: UpdateCourseInput): Promise<Course> {
    const response = await apiClient.patch<{ course: Course }>(`/courses/${courseId}`, data);
    return mapCourse(response.course || response);
}

export async function updateProject(projectId: string, data: UpdateCourseInput): Promise<Project> {
    return updateCourse(projectId, data);
}

export async function deleteCourse(courseId: string): Promise<void> {
    await apiClient.delete(`/courses/${courseId}`);
}

export async function deleteProject(projectId: string): Promise<void> {
    await deleteCourse(projectId);
}
