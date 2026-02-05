console.log("Starting debug...");
try {
  require("dotenv").config();
  console.log("Dotenv loaded");
  const express = require("express");
  console.log("Express loaded");
  // Try loading GeminiProvider dependencies first
  try {
    require("@google/genai");
    console.log("@google/genai loaded");
  } catch (e) {
    console.error("Failed to load @google/genai", e);
  }

  const { GeminiProvider } = require("./geminiProvider");
  console.log("GeminiProvider loaded");

  require("cors");
  console.log("cors loaded");

  require("groq-sdk");
  console.log("groq-sdk loaded");
} catch (e) {
  console.error("Crash during load:", e);
}
