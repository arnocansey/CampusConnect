"use client";

import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { MessageCircle, X, Sparkles, Clock } from "lucide-react";

export function AIChatWidget() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  if (!user) return null;

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-24 md:bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all duration-300 hover:scale-110 ${
          isOpen
            ? "bg-gray-800 dark:bg-gray-700 rotate-0"
            : "bg-gradient-to-br from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
        }`}
        aria-label={isOpen ? "Close chat" : "Open AI assistant"}
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <MessageCircle className="w-6 h-6 text-white" />
        )}
        {!isOpen && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full border-2 border-white dark:border-gray-900" />
        )}
      </button>

      {/* Coming Soon Panel */}
      {isOpen && (
        <div className="fixed bottom-40 md:bottom-24 right-6 z-50 w-[350px] sm:w-[400px] max-w-[calc(100vw-3rem)] h-[500px] max-h-[calc(100vh-14rem)] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden transition-all duration-300">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-4 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-white font-semibold text-sm">CampusConnect AI</h3>
                <p className="text-white/70 text-xs">Coming Soon</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 hover:bg-white/20 rounded-full transition"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>

          {/* Coming Soon Content */}
          <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
            <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center mb-4">
              <Clock className="w-8 h-8 text-blue-500 dark:text-blue-400" />
            </div>
            <h4 className="text-lg font-bold text-gray-800 dark:text-white mb-2">
              AI Assistant Coming Soon
            </h4>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-xs">
              We&apos;re building an AI assistant to help you with campus life and app questions. Stay tuned!
            </p>

            <div className="w-full space-y-2 mb-6">
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center shrink-0">
                  <span className="text-sm">🏫</span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-300 text-left">
                  Get answers about UCC campus life
                </p>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center shrink-0">
                  <span className="text-sm">📱</span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-300 text-left">
                  Learn how to use CampusConnect features
                </p>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center shrink-0">
                  <span className="text-sm">💬</span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-300 text-left">
                  Get help with marketplace, notes, and more
                </p>
              </div>
            </div>

            <p className="text-xs text-gray-400 dark:text-gray-500">
              Need help now? Use the live chat
            </p>
          </div>
        </div>
      )}
    </>
  );
}
