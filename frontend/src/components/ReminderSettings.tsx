import React, { useState, useEffect } from "react";
import { dtrService } from "../services/dtrService";
import Button from "./ui/Button";
import Input from "./ui/Input";
import Card from "./ui/Card";

interface ReminderSettings {
  enableClockInReminder: boolean;
  clockInReminderTime: string;
  enableClockOutReminder: boolean;
  clockOutReminderMinutes: number;
  notificationMethod: "push" | "email" | "both";
  timezone: string;
}

export const ReminderSettings: React.FC = () => {
  const [settings, setSettings] = useState<ReminderSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(
    null,
  );

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const data = await dtrService.getReminderSettings();
      setSettings(data);
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to load reminder settings",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, type, value, checked } = e.target as any;

    setSettings((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        [name]: type === "checkbox" ? checked : value === "true" ? true : value === "false" ? false : value,
      };
    });
  };

  const handleSave = async () => {
    if (!settings) return;

    try {
      setIsSaving(true);
      await dtrService.updateReminderSettings(settings);
      setMessage({ type: "success", text: "Reminder settings updated successfully" });
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to save settings",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    try {
      setIsSaving(true);
      const resetSettings = await dtrService.resetReminderSettings();
      setSettings(resetSettings);
      setMessage({ type: "success", text: "Settings reset to defaults" });
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to reset settings",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <p className="text-center text-gray-500">Loading settings...</p>
      </Card>
    );
  }

  if (!settings) {
    return (
      <Card className="p-6">
        <p className="text-center text-red-500">Failed to load settings</p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h2 className="text-xl font-bold mb-4">DTR Reminder Settings</h2>

      {message && (
        <div
          className={`mb-4 p-3 rounded ${
            message.type === "success"
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="space-y-6">
        {/* Clock In Reminder */}
        <div className="border rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <label className="text-lg font-medium">Clock In Reminder</label>
            <input
              type="checkbox"
              name="enableClockInReminder"
              checked={settings.enableClockInReminder}
              onChange={handleChange}
              className="w-5 h-5"
            />
          </div>

          {settings.enableClockInReminder && (
            <div>
              <label className="block text-sm font-medium mb-2">Reminder Time</label>
              <Input
                type="time"
                name="clockInReminderTime"
                value={settings.clockInReminderTime}
                onChange={handleChange}
              />
            </div>
          )}
        </div>

        {/* Clock Out Reminder */}
        <div className="border rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <label className="text-lg font-medium">Clock Out Reminder</label>
            <input
              type="checkbox"
              name="enableClockOutReminder"
              checked={settings.enableClockOutReminder}
              onChange={handleChange}
              className="w-5 h-5"
            />
          </div>

          {settings.enableClockOutReminder && (
            <div>
              <label className="block text-sm font-medium mb-2">
                Minutes Before End Time
              </label>
              <Input
                type="number"
                name="clockOutReminderMinutes"
                value={settings.clockOutReminderMinutes}
                onChange={handleChange}
                min="1"
                max="120"
              />
              <p className="text-xs text-gray-500 mt-1">
                You'll get reminded {settings.clockOutReminderMinutes} minutes before your
                shift ends
              </p>
            </div>
          )}
        </div>

        {/* Notification Method */}
        <div className="border rounded-lg p-4">
          <label className="block text-lg font-medium mb-3">Notification Method</label>
          <select
            name="notificationMethod"
            value={settings.notificationMethod}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="push">Push Notification</option>
            <option value="email">Email</option>
            <option value="both">Both Push & Email</option>
          </select>
        </div>

        {/* Timezone */}
        <div className="border rounded-lg p-4">
          <label className="block text-lg font-medium mb-3">Timezone</label>
          <select
            name="timezone"
            value={settings.timezone}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="Asia/Manila">Asia/Manila (UTC+8)</option>
            <option value="Asia/Bangkok">Asia/Bangkok (UTC+7)</option>
            <option value="Asia/Singapore">Asia/Singapore (UTC+8)</option>
            <option value="Asia/Tokyo">Asia/Tokyo (UTC+9)</option>
            <option value="UTC">UTC</option>
            <option value="America/New_York">America/New_York (UTC-5)</option>
            <option value="America/Los_Angeles">America/Los_Angeles (UTC-8)</option>
            <option value="Europe/London">Europe/London (UTC+0)</option>
            <option value="Europe/Paris">Europe/Paris (UTC+1)</option>
          </select>
        </div>
      </div>

      <div className="flex gap-3 mt-6">
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="flex-1 bg-blue-600 text-white hover:bg-blue-700"
        >
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
        <Button
          onClick={handleReset}
          disabled={isSaving}
          className="flex-1 bg-gray-400 text-white hover:bg-gray-500"
        >
          Reset to Defaults
        </Button>
      </div>
    </Card>
  );
};
