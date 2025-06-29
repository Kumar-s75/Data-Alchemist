"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Upload, Settings, Download, Sparkles, Zap, Menu, Atom } from "lucide-react"
import DataIngestion from "@/components/data-ingestion"
import DataValidation from "@/components/data-validation"
import RuleBuilder from "@/components/rule-builder"
import PrioritizationPanel from "@/components/prioritization-panel"
import ExportPanel from "@/components/export-panel"
import { DataProvider } from "@/contexts/data-context"
import AIInsightsDashboard from "@/components/ai-insights-dashboard"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.8,
      staggerChildren: 0.2,
    },
  },
}

const itemVariants = {
  hidden: { y: 30, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.6, ease: "easeOut" },
  },
}

const tabVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4 },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: { duration: 0.3 },
  },
}

const logoVariants = {
  hidden: { scale: 0, rotate: -180 },
  visible: {
    scale: 1,
    rotate: 0,
    transition: {
      type: "spring",
      stiffness: 260,
      damping: 20,
      duration: 1,
    },
  },
}

const titleVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: "easeOut",
      delay: 0.3,
    },
  },
}

export default function DataAlchemist() {
  const [activeTab, setActiveTab] = useState("ingestion")
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const tabs = [
    {
      value: "ingestion",
      label: "Upload",
      icon: Upload,
      description: "Import data files",
    },
    {
      value: "validation",
      label: "Validate",
      icon: Sparkles,
      description: "Fix data issues",
    },
    {
      value: "rules",
      label: "Rules",
      icon: Settings,
      description: "Business logic",
    },
    {
      value: "priorities",
      label: "Priorities",
      icon: Zap,
      description: "Set weights",
    },
    {
      value: "export",
      label: "Export",
      icon: Download,
      description: "Download config",
    },
  ]

  const MobileNavigation = () => (
    <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden glass-button fixed top-6 right-6 z-50">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80 agamify-gradient border-r border-white/10">
        <div className="flex flex-col space-y-4 mt-8">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <Button
                key={tab.value}
                variant="ghost"
                className={`justify-start h-auto p-4 glass-button ${
                  activeTab === tab.value ? "bg-blue-500/20 border-blue-500/30" : ""
                }`}
                onClick={() => {
                  setActiveTab(tab.value)
                  setMobileMenuOpen(false)
                }}
              >
                <Icon className="h-5 w-5 mr-3" />
                <div className="text-left">
                  <div className="font-medium text-white">{tab.label}</div>
                  <div className="text-xs text-white/60">{tab.description}</div>
                </div>
              </Button>
            )
          })}
        </div>
      </SheetContent>
    </Sheet>
  )

  return (
    <DataProvider>
      <div className="agamify-gradient min-h-screen relative overflow-hidden">
   
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          
          <motion.div
            className="absolute top-20 left-10 w-2 h-2 bg-blue-400/30 rounded-full"
            animate={{
              y: [0, -20, 0],
              opacity: [0.3, 0.8, 0.3],
            }}
            transition={{
              duration: 4,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="absolute top-40 right-20 w-1 h-1 bg-purple-400/40 rounded-full"
            animate={{
              y: [0, -15, 0],
              opacity: [0.4, 0.9, 0.4],
            }}
            transition={{
              duration: 3,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              delay: 1,
            }}
          />
          <motion.div
            className="absolute bottom-40 left-1/4 w-1.5 h-1.5 bg-green-400/30 rounded-full"
            animate={{
              y: [0, -25, 0],
              opacity: [0.3, 0.7, 0.3],
            }}
            transition={{
              duration: 5,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              delay: 2,
            }}
          />
        </div>

        <motion.div
          className="container mx-auto px-4 py-6 md:py-8 relative z-10"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <MobileNavigation />

         
          <motion.div className="text-center mb-16 md:mb-20 relative" variants={itemVariants}>
         
            <div className="flex flex-col items-center mb-8">
              <motion.div
                className="relative mb-4"
                variants={logoVariants}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
              
                <div className="relative">
                  <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-blue-500 via-purple-600 to-cyan-500 flex items-center justify-center shadow-2xl">
                    <Atom className="h-8 w-8 md:h-10 md:w-10 text-white" />
                  </div>

                  <motion.div
                    className="absolute inset-0 rounded-full border-2 border-blue-400/30"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                    style={{ width: "120%", height: "120%", top: "-10%", left: "-10%" }}
                  />
                  <motion.div
                    className="absolute inset-0 rounded-full border border-purple-400/20"
                    animate={{ rotate: -360 }}
                    transition={{ duration: 15, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                    style={{ width: "140%", height: "140%", top: "-20%", left: "-20%" }}
                  />

                 
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-purple-600/20 to-cyan-500/20 rounded-full blur-xl"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
                    style={{ width: "150%", height: "150%", top: "-25%", left: "-25%" }}
                  />
                </div>
              </motion.div>

              <motion.div variants={titleVariants} className="space-y-4">
                <motion.h1
                  className="hero-text text-xl md:text-2xl lg:text-3xl font-bold leading-tight tracking-wider"
                  initial={{ opacity: 0, letterSpacing: "0.5em" }}
                  animate={{ opacity: 1, letterSpacing: "0.1em" }}
                  transition={{ duration: 1, delay: 0.5 }}
                >
                  DATA ALCHEMIST
                </motion.h1>
              </motion.div>
            </div>

            <motion.div className="pill-badge inline-block mb-8" variants={itemVariants}>
              Transform once, deploy everywhere, visualize everything.
            </motion.div>

            <motion.h2
              className="hero-subtitle text-lg md:text-xl lg:text-2xl max-w-4xl mx-auto mb-12 leading-relaxed font-light"
              variants={itemVariants}
            >
              Transform spreadsheets into clean, validated data with AI.
            </motion.h2>

        
            <motion.div className="flex flex-wrap justify-center gap-4 mb-12" variants={itemVariants}>
              {[
                { icon: Sparkles, text: "AI Column Mapping" },
                { icon: Zap, text: "Smart Validation" },
                { icon: Settings, text: "Rule Generation" },
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  className="flex items-center gap-2 px-4 py-2 glass-card rounded-full"
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  <feature.icon className="h-4 w-4 text-blue-400" />
                  <span className="text-sm text-white/80">{feature.text}</span>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

        
          <motion.div variants={itemVariants}>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
             
              <TabsList className="agamify-tabs hidden md:grid w-full grid-cols-5 mb-8 h-auto p-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon
                  return (
                    <TabsTrigger
                      key={tab.value}
                      value={tab.value}
                      className="agamify-tab flex flex-col items-center gap-2 p-4"
                    >
                      <Icon className="h-5 w-5" />
                      <div className="text-center">
                        <div className="font-medium text-sm">{tab.label}</div>
                        <div className="text-xs opacity-70">{tab.description}</div>
                      </div>
                    </TabsTrigger>
                  )
                })}
              </TabsList>

             
              <div className="md:hidden mb-6 flex justify-center">
                <div className="pill-badge">{tabs.find((tab) => tab.value === activeTab)?.label}</div>
              </div>

           
              <AnimatePresence mode="wait">
                <motion.div key={activeTab} variants={tabVariants} initial="hidden" animate="visible" exit="exit">
                  <TabsContent value="ingestion" className="mt-0">
                    <DataIngestion />
                  </TabsContent>

                  <TabsContent value="validation" className="mt-0">
                    <div className="space-y-6">
                      <DataValidation />
                      <AIInsightsDashboard />
                    </div>
                  </TabsContent>

                  <TabsContent value="rules" className="mt-0">
                    <RuleBuilder />
                  </TabsContent>

                  <TabsContent value="priorities" className="mt-0">
                    <PrioritizationPanel />
                  </TabsContent>

                  <TabsContent value="export" className="mt-0">
                    <ExportPanel />
                  </TabsContent>
                </motion.div>
              </AnimatePresence>
            </Tabs>
          </motion.div>
        </motion.div>
      </div>
    </DataProvider>
  )
}
