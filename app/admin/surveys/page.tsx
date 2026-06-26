"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Plus, ClipboardList, Users, BarChart3, Send, X } from "lucide-react"
import { toast } from "sonner"

interface Question {
  id?: string
  question_text: string
  question_type: "single_choice" | "multiple_choice" | "text" | "scale" | "yes_no"
  options?: string[]
  is_required: boolean
  order_index: number
}

interface Questionnaire {
  id: string
  title: string
  description: string
  status: string
  target_audience: string
  start_date: string
  end_date: string
  is_required: boolean
  send_notification: boolean
  created_at: string
  response_count?: number
}

export default function SurveysPage() {
  const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showAnalyticsDialog, setShowAnalyticsDialog] = useState(false)
  const [selectedQuestionnaire, setSelectedQuestionnaire] = useState<Questionnaire | null>(null)
  const [analyticsData, setAnalyticsData] = useState<any>(null)

  // Form state
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [targetAudience, setTargetAudience] = useState("all")
  const [isRequired, setIsRequired] = useState(false)
  const [sendNotification, setSendNotification] = useState(true)
  const [questions, setQuestions] = useState<Question[]>([
    { question_text: "", question_type: "single_choice", options: [""], is_required: false, order_index: 0 },
  ])

  useEffect(() => {
    fetchQuestionnaires()
  }, [])

  const fetchQuestionnaires = async () => {
    try {
      const response = await fetch("/api/admin/surveys")
      const data = await response.json()
      setQuestionnaires(data.questionnaires || [])
    } catch (error) {
      console.error("Error fetching questionnaires:", error)
      toast.error("Failed to load questionnaires")
    } finally {
      setLoading(false)
    }
  }

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        question_text: "",
        question_type: "single_choice",
        options: [""],
        is_required: false,
        order_index: questions.length,
      },
    ])
  }

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index))
  }

  const updateQuestion = (index: number, field: string, value: any) => {
    const updated = [...questions]
    updated[index] = { ...updated[index], [field]: value }
    setQuestions(updated)
  }

  const addOption = (questionIndex: number) => {
    const updated = [...questions]
    updated[questionIndex].options = [...(updated[questionIndex].options || []), ""]
    setQuestions(updated)
  }

  const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
    const updated = [...questions]
    const options = [...(updated[questionIndex].options || [])]
    options[optionIndex] = value
    updated[questionIndex].options = options
    setQuestions(updated)
  }

  const removeOption = (questionIndex: number, optionIndex: number) => {
    const updated = [...questions]
    updated[questionIndex].options = (updated[questionIndex].options || []).filter((_, i) => i !== optionIndex)
    setQuestions(updated)
  }

  const handleCreateQuestionnaire = async () => {
    if (!title.trim()) {
      toast.error("Please enter a title")
      return
    }

    if (questions.some((q) => !q.question_text.trim())) {
      toast.error("All questions must have text")
      return
    }

    try {
      const response = await fetch("/api/admin/surveys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          target_audience: targetAudience,
          is_required: isRequired,
          send_notification: sendNotification,
          questions,
        }),
      })

      if (response.ok) {
        toast.success("Questionnaire created successfully")
        setShowCreateDialog(false)
        resetForm()
        fetchQuestionnaires()
      } else {
        toast.error("Failed to create questionnaire")
      }
    } catch (error) {
      console.error("Error creating questionnaire:", error)
      toast.error("Failed to create questionnaire")
    }
  }

  const handleActivateQuestionnaire = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/surveys/${id}/activate`, {
        method: "POST",
      })

      if (response.ok) {
        toast.success("Questionnaire activated and notifications sent!")
        fetchQuestionnaires()
      } else {
        toast.error("Failed to activate questionnaire")
      }
    } catch (error) {
      console.error("Error activating questionnaire:", error)
      toast.error("Failed to activate questionnaire")
    }
  }

  const handleViewAnalytics = async (questionnaire: Questionnaire) => {
    setSelectedQuestionnaire(questionnaire)
    setShowAnalyticsDialog(true)

    try {
      const response = await fetch(`/api/admin/surveys/${questionnaire.id}/analytics`)
      const data = await response.json()
      setAnalyticsData(data)
    } catch (error) {
      console.error("Error fetching analytics:", error)
      toast.error("Failed to load analytics")
    }
  }

  const resetForm = () => {
    setTitle("")
    setDescription("")
    setTargetAudience("all")
    setIsRequired(false)
    setSendNotification(true)
    setQuestions([
      { question_text: "", question_type: "single_choice", options: [""], is_required: false, order_index: 0 },
    ])
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500/10 text-green-600 border-green-500/20"
      case "draft":
        return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20"
      case "closed":
        return "bg-gray-500/10 text-gray-600 border-gray-500/20"
      default:
        return "bg-gray-500/10 text-gray-600 border-gray-500/20"
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-heading font-bold">Questionnaires & Surveys</h1>
          <p className="text-muted-foreground mt-1">Create and analyze alumni feedback</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} className="w-full sm:w-auto gap-2">
          <Plus className="h-4 w-4" />
          Create Questionnaire
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Surveys</p>
                <p className="text-2xl font-bold mt-1">{questionnaires.length}</p>
              </div>
              <ClipboardList className="h-8 w-8 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold mt-1 text-green-600">
                  {questionnaires.filter((q) => q.status === "active").length}
                </p>
              </div>
              <Send className="h-8 w-8 text-green-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Responses</p>
                <p className="text-2xl font-bold mt-1">
                  {questionnaires.reduce((sum, q) => sum + (q.response_count || 0), 0)}
                </p>
              </div>
              <Users className="h-8 w-8 text-blue-600 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Questionnaires List */}
      <div className="grid grid-cols-1 gap-4">
        {questionnaires.map((q) => (
          <Card key={q.id} className="glass-card">
            <CardContent className="pt-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold">{q.title}</h3>
                    <Badge className={getStatusColor(q.status)}>{q.status}</Badge>
                    {q.is_required && <Badge variant="destructive">Required</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{q.description}</p>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    <span>Target: {q.target_audience}</span>
                    <span>Responses: {q.response_count || 0}</span>
                    <span>Created: {new Date(q.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  {q.status === "draft" && (
                    <Button size="sm" onClick={() => handleActivateQuestionnaire(q.id)} className="gap-2">
                      <Send className="h-4 w-4" />
                      Activate
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={() => handleViewAnalytics(q)} className="gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Analytics
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="w-[95vw] max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Questionnaire</DialogTitle>
            <DialogDescription>Design a survey to gather feedback from alumni</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Basic Info */}
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Alumni Career Satisfaction Survey"
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of the survey purpose"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Target Audience</Label>
                <Select value={targetAudience} onValueChange={setTargetAudience}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Alumni</SelectItem>
                    <SelectItem value="annual_members">Annual Members</SelectItem>
                    <SelectItem value="lifetime_members">Lifetime Members</SelectItem>
                    <SelectItem value="nairobi">Nairobi Campus</SelectItem>
                    <SelectItem value="mombasa">Mombasa Campus</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Required Survey</Label>
                  <Switch checked={isRequired} onCheckedChange={setIsRequired} />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Send Notification</Label>
                  <Switch checked={sendNotification} onCheckedChange={setSendNotification} />
                </div>
              </div>
            </div>

            {/* Questions */}
            <div className="space-y-4 border-t pt-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Questions</h3>
                <Button type="button" size="sm" variant="outline" onClick={addQuestion}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Question
                </Button>
              </div>

              {questions.map((question, qIndex) => (
                <Card key={qIndex} className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <Label>Question {qIndex + 1}</Label>
                      {questions.length > 1 && (
                        <Button type="button" size="sm" variant="ghost" onClick={() => removeQuestion(qIndex)}>
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <Input
                      value={question.question_text}
                      onChange={(e) => updateQuestion(qIndex, "question_text", e.target.value)}
                      placeholder="Enter your question"
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Question Type</Label>
                        <Select
                          value={question.question_type}
                          onValueChange={(value) => updateQuestion(qIndex, "question_type", value)}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="single_choice">Single Choice</SelectItem>
                            <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                            <SelectItem value="text">Text Answer</SelectItem>
                            <SelectItem value="scale">Scale (1-10)</SelectItem>
                            <SelectItem value="yes_no">Yes/No</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-end">
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={question.is_required}
                            onChange={(e) => updateQuestion(qIndex, "is_required", e.target.checked)}
                            className="rounded"
                          />
                          Required
                        </label>
                      </div>
                    </div>

                    {/* Options for choice-based questions */}
                    {(question.question_type === "single_choice" || question.question_type === "multiple_choice") && (
                      <div className="space-y-2 pl-4 border-l-2">
                        <Label className="text-xs">Options</Label>
                        {(question.options || []).map((option, oIndex) => (
                          <div key={oIndex} className="flex gap-2">
                            <Input
                              value={option}
                              onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                              placeholder={`Option ${oIndex + 1}`}
                              className="h-9"
                            />
                            {(question.options || []).length > 1 && (
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                onClick={() => removeOption(qIndex, oIndex)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                        <Button type="button" size="sm" variant="outline" onClick={() => addOption(qIndex)}>
                          <Plus className="h-3 w-3 mr-1" />
                          Add Option
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateQuestionnaire}>Create Questionnaire</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Analytics Dialog */}
      <Dialog open={showAnalyticsDialog} onOpenChange={setShowAnalyticsDialog}>
        <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedQuestionnaire?.title}</DialogTitle>
            <DialogDescription>Response Analytics</DialogDescription>
          </DialogHeader>

          {analyticsData ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground">Total Responses</p>
                    <p className="text-2xl font-bold mt-1">{analyticsData.total_responses || 0}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground">Completion Rate</p>
                    <p className="text-2xl font-bold mt-1">{analyticsData.completion_rate || 0}%</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground">Avg. Time</p>
                    <p className="text-2xl font-bold mt-1">{analyticsData.avg_time || 0}s</p>
                  </CardContent>
                </Card>
              </div>

              {/* Question-by-question breakdown */}
              <div className="space-y-4">
                <h3 className="font-semibold">Question Responses</h3>
                {analyticsData.questions?.map((q: any, index: number) => (
                  <Card key={index}>
                    <CardHeader>
                      <CardTitle className="text-base">{q.question_text}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {q.type === "text" ? (
                        <div className="space-y-2">
                          {q.responses?.slice(0, 5).map((r: string, i: number) => (
                            <p key={i} className="text-sm text-muted-foreground border-l-2 pl-3">
                              {r}
                            </p>
                          ))}
                          {q.responses?.length > 5 && (
                            <p className="text-sm text-muted-foreground">...and {q.responses.length - 5} more</p>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {q.options?.map((opt: any, i: number) => (
                            <div key={i} className="flex items-center gap-3">
                              <div className="flex-1">
                                <div className="flex justify-between mb-1">
                                  <span className="text-sm">{opt.option}</span>
                                  <span className="text-sm font-medium">
                                    {opt.count} ({opt.percentage}%)
                                  </span>
                                </div>
                                <div className="h-2 bg-muted rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-primary transition-all"
                                    style={{ width: `${opt.percentage}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
