'use client'

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Plus, MapPin, Edit2, Save, X, Loader2, Flag } from 'lucide-react';
import { getCourses, createCourse, updateCourse } from '@/lib/supabase/client';
import { useNavigation } from '@/hooks/useNavigation';
import { formatDate } from '@/lib/utils';

interface Course {
  id: string;
  name: string;
  location: string | null;
  par: number;
  created_at: string;
}

interface CourseFormData {
  name: string;
  location: string;
  par: string;
}

export default function ManageCoursesView() {
  const nav = useNavigation();
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [newCourse, setNewCourse] = useState<CourseFormData>({
    name: '',
    location: '',
    par: '72'
  });

  const [editCourse, setEditCourse] = useState<CourseFormData>({
    name: '',
    location: '',
    par: '72'
  });

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setIsLoading(true);
      const data = await getCourses();
      setCourses(data);
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast.error('Failed to load courses');
    } finally {
      setIsLoading(false);
    }
  };

  const isDuplicateName = (name: string, excludeId?: string): boolean => {
    return courses.some(
      course =>
        course.name.toLowerCase().trim() === name.toLowerCase().trim() &&
        course.id !== excludeId
    );
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = newCourse.name.trim();
    if (!trimmedName) {
      toast.error('Course name is required');
      return;
    }

    const parValue = parseInt(newCourse.par);
    if (isNaN(parValue) || parValue < 54 || parValue > 90) {
      toast.error('Par must be between 54 and 90');
      return;
    }

    if (isDuplicateName(trimmedName)) {
      toast.error('A course with this name already exists');
      return;
    }

    try {
      setIsSubmitting(true);
      await createCourse({
        name: trimmedName,
        location: newCourse.location.trim() || undefined,
        par: parValue
      });

      toast.success('Course created successfully');
      setNewCourse({ name: '', location: '', par: '72' });
      setShowAddForm(false);
      await fetchCourses();
    } catch (error) {
      console.error('Error creating course:', error);
      toast.error('Failed to create course');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (courseId: string) => {
    const trimmedName = editCourse.name.trim();
    if (!trimmedName) {
      toast.error('Course name is required');
      return;
    }

    const parValue = parseInt(editCourse.par);
    if (isNaN(parValue) || parValue < 54 || parValue > 90) {
      toast.error('Par must be between 54 and 90');
      return;
    }

    if (isDuplicateName(trimmedName, courseId)) {
      toast.error('A course with this name already exists');
      return;
    }

    try {
      setIsSubmitting(true);
      await updateCourse(courseId, {
        name: trimmedName,
        location: editCourse.location.trim() || undefined,
        par: parValue
      });

      toast.success('Course updated successfully');
      setEditingId(null);
      await fetchCourses();
    } catch (error) {
      console.error('Error updating course:', error);
      toast.error('Failed to update course');
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEdit = (course: Course) => {
    setEditingId(course.id);
    setEditCourse({
      name: course.name,
      location: course.location || '',
      par: course.par.toString()
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditCourse({ name: '', location: '', par: '72' });
  };

  const cancelAdd = () => {
    setShowAddForm(false);
    setNewCourse({ name: '', location: '', par: '72' });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Flag className="h-5 w-5" />
                Manage Courses
              </CardTitle>
              <CardDescription>
                Add and edit golf courses for your organization
              </CardDescription>
            </div>
            <Button variant="outline" onClick={nav.goToDashboard}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!showAddForm && (
            <Button onClick={() => setShowAddForm(true)} className="mb-6">
              <Plus className="h-4 w-4 mr-2" />
              Add Course
            </Button>
          )}

          {showAddForm && (
            <Card className="mb-6 border-2 border-primary/20">
              <CardHeader>
                <CardTitle className="text-lg">Add New Course</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreate} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="new-name">
                        Course Name <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="new-name"
                        value={newCourse.name}
                        onChange={(e) => setNewCourse({ ...newCourse, name: e.target.value })}
                        placeholder="e.g., Pebble Beach"
                        required
                        disabled={isSubmitting}
                        autoFocus
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-location">Location</Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="new-location"
                          value={newCourse.location}
                          onChange={(e) => setNewCourse({ ...newCourse, location: e.target.value })}
                          placeholder="e.g., Pebble Beach, CA"
                          className="pl-9"
                          disabled={isSubmitting}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-par">
                        Par <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="new-par"
                        type="number"
                        value={newCourse.par}
                        onChange={(e) => setNewCourse({ ...newCourse, par: e.target.value })}
                        placeholder="72"
                        min="54"
                        max="90"
                        required
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={cancelAdd}
                      disabled={isSubmitting}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Create Course
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : courses.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Flag className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No courses yet</p>
              <p className="text-sm">Create your first course to get started</p>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Course Name</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead className="text-center">Par</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {courses.map((course) => (
                    <TableRow key={course.id}>
                      {editingId === course.id ? (
                        <>
                          <TableCell>
                            <Input
                              value={editCourse.name}
                              onChange={(e) => setEditCourse({ ...editCourse, name: e.target.value })}
                              placeholder="Course name"
                              disabled={isSubmitting}
                              className="h-8"
                            />
                          </TableCell>
                          <TableCell>
                            <div className="relative">
                              <MapPin className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                              <Input
                                value={editCourse.location}
                                onChange={(e) => setEditCourse({ ...editCourse, location: e.target.value })}
                                placeholder="Location"
                                disabled={isSubmitting}
                                className="h-8 pl-7"
                              />
                            </div>
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={editCourse.par}
                              onChange={(e) => setEditCourse({ ...editCourse, par: e.target.value })}
                              min="54"
                              max="90"
                              disabled={isSubmitting}
                              className="h-8 text-center"
                            />
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground">
                              {formatDate(course.created_at)}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-1 justify-end">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleUpdate(course.id)}
                                disabled={isSubmitting}
                              >
                                {isSubmitting ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Save className="h-3 w-3" />
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={cancelEdit}
                                disabled={isSubmitting}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </>
                      ) : (
                        <>
                          <TableCell className="font-medium">{course.name}</TableCell>
                          <TableCell>
                            {course.location ? (
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <MapPin className="h-3 w-3" />
                                <span className="text-sm">{course.location}</span>
                              </div>
                            ) : (
                              <span className="text-sm text-muted-foreground italic">No location</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="inline-flex items-center gap-1 font-mono text-sm">
                              <Flag className="h-3 w-3" />
                              {course.par}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground">
                              {formatDate(course.created_at)}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => startEdit(course)}
                              disabled={editingId !== null || showAddForm}
                            >
                              <Edit2 className="h-3 w-3" />
                            </Button>
                          </TableCell>
                        </>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
