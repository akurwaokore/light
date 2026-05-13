"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { AlertCircle } from "lucide-react"
import { toast } from "sonner"

interface Question {
  id: string
  question_text: string
  question_type: string
  options?: string[]
  is_required: boolean
  order_index: number
}

interface Questionnaire {
  id: string
  title: string
  description: string
  is_required: boolean
  questionnaire_questions: Question[]
}

export function QuestionnairePopup() {
  const [open, setOpen] = useState(false)
  const [questionnaire, setQuestionnaire] = useState<Questionnaire | null>(null)
  const [answers, setAnswers] = useState<Record<string, any>>({})
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [startTime, setStartTime] = useState<number>(0)

  useEffect(() => {
    let mounted = true
    // Check for active questionnaires when notifications are received
    const checkForQuestionnaires = async () => {
      try {
        const response = await fetch("/api/questionnaires/active")
        if (!response.ok) {
          return
        }
        const data = await response.json()

        if (mounted && data.questionnaire) {
          setQuestionnaire(data.questionnaire)
          setOpen(true)
          setStartTime(Date.now())
        }
      } catch (error) {
        // Silently fail - questionnaire feature may not be set up
      }
    }

    // Listen for questionnaire notifications
    const handleNotification = (e: CustomEvent) => {
      if (e.detail.type === "questionnaire") {
        checkForQuestionnaires()
      }
    }

    window.addEventListener("notification" as any, handleNotification as any)

    // Check on mount
    checkForQuestionnaires()

    return () => {
      mounted = false
      window.removeEventListener("notification" as any, handleNotification as any)
    }
  }, [])

  const handleAnswerChange = (questionId: string, value: any) => {
    setAnswers({ ...answers, [questionId]: value })
  }

  const handleNext = () => {
    const currentQuestion = questionnaire?.questionnaire_questions[currentQuestionIndex]
    if (currentQuestion?.is_required && !answers[currentQuestion.id]) {
      toast.error("This question is required")
      return
    }

    if (currentQuestionIndex < (questionnaire?.questionnaire_questions.length || 0) - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    } else {
      handleSubmit()
    }
  }

  const handleBack = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
    }
  }

  const handleSubmit = async () => {
    try {
      const timeTaken = Math.round((Date.now() - startTime) / 1000)

      const responses = Object.entries(answers).map(([questionId, answer]) => ({
        question_id: questionId,
        answer,
      }))

      const response = await fetch("/api/questionnaires/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionnaire_id: questionnaire?.id,
          responses,
          time_taken_seconds: timeTaken,
        }),
      })

      if (response.ok) {
        toast.success("Thank you for your response!")
        setOpen(false)
        setQuestionnaire(null)
        setAnswers({})
        setCurrentQuestionIndex(0)
      } else {
        toast.error("Failed to submit response")
      }
    } catch (error) {
      console.error("[akurwas] Error submitting questionnaire:", error)
      toast.error("Failed to submit response")
    }
  }

  const handleSkip = () => {
    if (!questionnaire?.is_required) {
      setOpen(false)
      toast.info("You can complete this survey later from your notifications")
    }
  }

  if (!questionnaire) return null

  const currentQuestion = questionnaire.questionnaire_questions[currentQuestionIndex]
  const progress = ((currentQuestionIndex + 1) / questionnaire.questionnaire_questions.length) * 100

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {questionnaire.is_required && <AlertCircle className="h-5 w-5 text-orange-500" />}
            {questionnaire.title}
          </DialogTitle>
          {questionnaire.description && <p className="text-sm text-muted-foreground">{questionnaire.description}</p>}
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>
                Question {currentQuestionIndex + 1} of {questionnaire.questionnaire_questions.length}
              </span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
          </div>

          {/* Current Question */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-start gap-2">
                {currentQuestion.question_text}
                {currentQuestion.is_required && <span className="text-red-500">*</span>}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Single Choice */}
              {currentQuestion.question_type === "single_choice" && (
                <RadioGroup
                  value={answers[currentQuestion.id]}
                  onValueChange={(value) => handleAnswerChange(currentQuestion.id, value)}
                >
                  {currentQuestion.options?.map((option, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <RadioGroupItem value={option} id={`option-${index}`} />
                      <Label htmlFor={`option-${index}`} className="cursor-pointer">
                        {option}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              )}

              {/* Multiple Choice */}
              {currentQuestion.question_type === "multiple_choice" && (
                <div className="space-y-3">
                  {currentQuestion.options?.map((option, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Checkbox
                        id={`option-${index}`}
                        checked={(answers[currentQuestion.id] || []).includes(option)}
                        onCheckedChange={(checked) => {
                          const current = answers[currentQuestion.id] || []
                          const updated = checked ? [...current, option] : current.filter((o: string) => o !== option)
                          handleAnswerChange(currentQuestion.id, updated)
                        }}
                      />
                      <Label htmlFor={`option-${index}`} className="cursor-pointer">
                        {option}
                      </Label>
                    </div>
                  ))}
                </div>
              )}

              {/* Text Answer */}
              {currentQuestion.question_type === "text" && (
                <Textarea
                  value={answers[currentQuestion.id] || ""}
                  onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                  placeholder="Enter your answer..."
                  rows={4}
                />
              )}

              {/* Yes/No */}
              {currentQuestion.question_type === "yes_no" && (
                <RadioGroup
                  value={answers[currentQuestion.id]}
                  onValueChange={(value) => handleAnswerChange(currentQuestion.id, value)}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="yes" />
                    <Label htmlFor="yes" className="cursor-pointer">
                      Yes
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="no" />
                    <Label htmlFor="no" className="cursor-pointer">
                      No
                    </Label>
                  </div>
                </RadioGroup>
              )}

              {/* Scale */}
              {currentQuestion.question_type === "scale" && (
                <div className="space-y-3">
                  <Input
                    type="range"
                    min="1"
                    max="10"
                    value={answers[currentQuestion.id] || 5}
                    onChange={(e) => handleAnswerChange(currentQuestion.id, Number.parseInt(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>1</span>
                    <span className="font-semibold text-foreground">{answers[currentQuestion.id] || 5}</span>
                    <span>10</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex justify-between">
            <div>
              {currentQuestionIndex > 0 && (
                <Button variant="outline" onClick={handleBack}>
                  Back
                </Button>
              )}
              {!questionnaire.is_required && currentQuestionIndex === 0 && (
                <Button variant="ghost" onClick={handleSkip}>
                  Skip for now
                </Button>
              )}
            </div>
            <Button onClick={handleNext}>
              {currentQuestionIndex === questionnaire.questionnaire_questions.length - 1 ? "Submit" : "Next"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
