"use client"

import * as React from "react"
import { useState, useRef, useEffect } from "react"
import { Bot, Send, X, ChevronDown, ChevronUp, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MarkdownRenderer } from "@/components/ui/markdown-renderer"

// Define FAQ questions
const faqQuestions = [
  "What is a SIP?",
  "How do I create a SIP?",
  "What's the SIP review process?",
  "What are SIP categories?",
  "How are SIPs implemented?",
  "What is the Sui blockchain?",
  "How many SIPs are there?",
  "What is the latest SIP?",
]

// Define FAQ answers
const faqAnswers: Record<string, string> = {
  "What is a SIP?": "A SIP (Sui Improvement Proposal) is a design document providing information to the Sui community about a proposed change to the Sui protocol, its processes, or environment. SIPs are the primary mechanism for proposing new features and collecting community input on issues.",
  "How do I create a SIP?": "To create a SIP, you should first discuss your idea in the Sui community forums. Then, draft your proposal following the SIP template, and submit it as a pull request to the Sui Foundation SIPs repository.",
  "What's the SIP review process?": "The SIP review process involves community discussion, technical review by core developers, and eventual acceptance or rejection. SIPs move through various statuses: Draft, Review, Last Call, Final, and Stagnant.",
  "What are SIP categories?": "SIPs are categorized into areas like Core, Storage, Wallet UX & Security, Governance, Staking, Gas, Economics, Crypto Primitives, Networking, and Dev Tools, based on the area of the Sui ecosystem they aim to improve.",
  "How are SIPs implemented?": "Once a SIP is approved, implementation begins by the proposer or other developers. The implementation is reviewed and tested before being merged into the Sui codebase. Some SIPs may require coordination with multiple teams.",
  "What is the Sui blockchain?": "Sui is a layer-1 blockchain designed for high throughput and low latency. It features a unique object-centric data model, parallel transaction execution, and horizontal scalability. Sui is built using the Move programming language, which provides enhanced security and flexible resource management.",
  "How many SIPs are there?": "I can check the current number of SIPs for you. Please ask me 'How many SIPs exist right now?' and I'll fetch the latest count from the repository.",
  "What is the latest SIP?": "I can check the latest SIPs for you. Please ask me 'What are the recent SIPs?' and I'll fetch the most recent proposals from the repository.",
}

interface ChatMessage {
  role: "user" | "assistant"
  content: string
  isLoading?: boolean
}

export function Chatbot() {
  const [isOpen, setIsOpen] = useState(false)
  const [isFaqExpanded, setIsFaqExpanded] = useState(true)
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: "👋 Hi! I'm the SIPs Assistant. How can I help you today?" }
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  
  // Scroll to bottom of messages when new message is added, but only within the chat container
  useEffect(() => {
    if (messagesEndRef.current) {
      const scrollArea = messagesEndRef.current.closest('.scroll-area-viewport')
      if (scrollArea) {
        scrollArea.scrollTop = scrollArea.scrollHeight
      }
    }
  }, [messages])
  
  // Focus input when chat is opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    }
  }, [isOpen])
  
    const handleSendMessage = async () => {
    if (!input.trim()) return
    
    const userMessage = input.trim()
    setInput("")
    
    // Close FAQ section when sending a message
    setIsFaqExpanded(false)
    
    // Add user message to chat
    setMessages(prev => [...prev, { role: "user", content: userMessage }])
    
    // Add loading message
    setMessages(prev => [...prev, { role: "assistant", content: "", isLoading: true }])
    setIsLoading(true)
    
    // Check if the question is in FAQ
    const faqQuestion = Object.keys(faqAnswers).find(
      q => q.toLowerCase() === userMessage.toLowerCase()
    )
    
    if (faqQuestion) {
      // If question is in FAQ, use the pre-defined answer
      setTimeout(() => {
        setMessages(prev => prev.filter(msg => !msg.isLoading))
        setMessages(prev => [...prev, { role: "assistant", content: faqAnswers[faqQuestion] }])
        setIsLoading(false)
      }, 500) // Small delay for better UX
      return
    }
    
    try {
      // Call chatbot API
      const response = await fetch("/api/chatbot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: userMessage }),
      })
      
      const data = await response.json()
      
      // Remove loading message
      setMessages(prev => prev.filter(msg => !msg.isLoading))
      
      if (response.ok) {
        setMessages(prev => [...prev, { role: "assistant", content: data.response }])
      } else {
        // Handle different error types
        let errorMessage = "I'm sorry, I couldn't process your request. Please try again later."
        
        if (response.status === 429) {
          errorMessage = "I'm receiving too many requests right now. Please try again in a moment."
        } else if (response.status === 408) {
          errorMessage = "The request took too long to process. Please try a shorter question."
        }
        
        // Use the error message from the API if available
        if (data && data.response) {
          errorMessage = data.response
        }
        
        setMessages(prev => [...prev, { role: "assistant", content: errorMessage }])
      }
    } catch (error) {
      // Remove loading message and add error message
      setMessages(prev => prev.filter(msg => !msg.isLoading))
      setMessages(prev => [
        ...prev, 
        { 
          role: "assistant", 
          content: "Sorry, there was an error connecting to the server. Please check your internet connection and try again." 
        }
      ])
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleFaqClick = (question: string) => {
    // Add question to chat
    setMessages(prev => [...prev, { role: "user", content: question }])
    
    // Add answer to chat
    setMessages(prev => [...prev, { role: "assistant", content: faqAnswers[question] }])
    
    // Always close FAQ section when a question is selected
    setIsFaqExpanded(false)
  }
  
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button 
            size="icon" 
            className="h-12 w-12 rounded-full shadow-lg bg-primary hover:bg-primary/90"
            aria-label="Open chat"
          >
            <MessageSquare className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent 
          side="right" 
          className="fixed bottom-0 right-0 left-auto w-[85%] top-auto h-[70vh] rounded-l-xl rounded-r-none md:h-auto md:bottom-4 md:right-4 md:left-auto md:top-auto md:max-w-[400px] md:rounded-2xl p-0 md:h-[600px] border border-border shadow-lg"
        >
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-3 sm:p-4 border-b">
              <div className="flex items-center gap-2">
                <div className="bg-primary/20 p-1.5 rounded-full">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                <h3 className="font-medium text-sm sm:text-base">SIPs Assistant</h3>
              </div>
            </div>
            
            {/* Chat container */}
            <div className="flex flex-1 flex-col overflow-hidden">
              {/* FAQ section */}
              <div className="border-b">
                <button
                  className="w-full px-3 sm:px-4 py-1.5 sm:py-2 flex items-center justify-between hover:bg-accent/50"
                  onClick={() => setIsFaqExpanded(!isFaqExpanded)}
                >
                  <span className="font-medium text-sm sm:text-base">Frequently Asked Questions</span>
                  {isFaqExpanded ? (
                    <ChevronUp className="h-3 w-3 sm:h-4 sm:w-4" />
                  ) : (
                    <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4" />
                  )}
                </button>
                
                {isFaqExpanded && (
                  <div className="p-1.5 sm:p-2 space-y-1">
                    {faqQuestions.map((question) => (
                      <Button
                        key={question}
                        variant="outline"
                        className="w-full justify-start text-left h-auto py-1.5 sm:py-2 px-2.5 sm:px-3 text-xs sm:text-sm"
                        onClick={() => handleFaqClick(question)}
                      >
                        {question}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.map((message, index) => (
                    <div
                      key={index}
                      className={cn(
                        "flex",
                        message.role === "user" ? "justify-end" : "justify-start"
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[80%] rounded-lg p-2 sm:p-3 text-xs sm:text-sm",
                          message.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        )}
                      >
                        {message.isLoading ? (
                          <div className="flex items-center space-x-1">
                            <div className="h-1.5 w-1.5 sm:h-2 sm:w-2 animate-bounce rounded-full bg-current"></div>
                            <div className="h-1.5 w-1.5 sm:h-2 sm:w-2 animate-bounce rounded-full bg-current" style={{ animationDelay: "0.2s" }}></div>
                            <div className="h-1.5 w-1.5 sm:h-2 sm:w-2 animate-bounce rounded-full bg-current" style={{ animationDelay: "0.4s" }}></div>
                          </div>
                        ) : (
                          <div className="prose prose-sm dark:prose-invert max-w-none">
                            <MarkdownRenderer content={message.content} />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
              
              {/* Input */}
              <div className="p-2.5 sm:p-4 border-t">
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    handleSendMessage()
                  }}
                  className="flex items-center gap-1.5 sm:gap-2"
                >
                  <Input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => {
                      setInput(e.target.value)
                      // Close FAQ section when user starts typing
                      if (e.target.value && isFaqExpanded) {
                        setIsFaqExpanded(false)
                      }
                    }}
                    placeholder="Type your question..."
                    className="flex-1 h-8 sm:h-10 text-xs sm:text-sm"
                    disabled={isLoading}
                  />
                  <Button 
                    type="submit" 
                    size="icon"
                    className="h-8 w-8 sm:h-10 sm:w-10"
                    disabled={isLoading || !input.trim()}
                  >
                    <Send className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
} 