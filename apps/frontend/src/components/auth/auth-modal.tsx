import { LogIn, UserRoundPlus } from "lucide-react";
import { useState } from "react";

import { CenterMorphModal, CenterMorphModalContent } from "../motion";
import { LoginForm } from "./login-form";
import { SignUpForm } from "./signup-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TAB_VALUES = ["signUp", "logIn"] as const;
type TabState = (typeof TAB_VALUES)[number];

export const AuthModal = ({ open, onOpenChange }: AuthModalProps) => {
  const [tabState, setTabState] = useState<TabState>("logIn");
  const [formError, setFormError] = useState<string>();

  return (
    <CenterMorphModal open={open} onOpenChange={onOpenChange}>
      <CenterMorphModalContent ariaLabel="请登录">
        <div className="flex flex-col gap-4 p-7 sm:p-8">
          <p className="text-xl">请登录</p>

          <Tabs
            values={TAB_VALUES}
            defaultValue={tabState}
            onValueChange={setTabState}
            variant="pill"
            icons="selected"
          >
            <TabsList>
              <TabsTrigger<TabState> value="signUp" icon={<UserRoundPlus className="size-3.5" />}>
                注册
              </TabsTrigger>
              <TabsTrigger<TabState> value="logIn" icon={<LogIn className="size-3.5" />}>
                登录
              </TabsTrigger>
            </TabsList>

            <TabsContent<TabState> value="signUp">
              <SignUpForm
                className="border-none p-0"
                title="创建您的账号"
                description=""
                errorMessage={formError}
                onSubmit={async (values) => {
                  setFormError(undefined);
                  await new Promise((resolve) => setTimeout(resolve, 1200));
                  if (values.email.toLowerCase().startsWith("taken@")) {
                    setFormError("That email is already registered.");
                    throw new Error("Email already registered");
                  }
                }}
              />
            </TabsContent>

            <TabsContent<TabState> value="logIn">
              <LoginForm className="border-none p-0" />
            </TabsContent>
          </Tabs>
        </div>
      </CenterMorphModalContent>
    </CenterMorphModal>
  );
};
