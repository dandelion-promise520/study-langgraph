import { getErrorMessage } from "@frontend/api";
import { useLogin, useRegister } from "@frontend/hooks";
import { CenterMorphModal, CenterMorphModalContent } from "@frontend/vendor/motion";
import { LogIn, UserRoundPlus } from "lucide-react";
import { useState } from "react";

import { LoginForm } from "./login-form";
import { RegisterForm } from "./register-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TAB_VALUES = ["register", "login"] as const;
type TabState = (typeof TAB_VALUES)[number];

export const AuthModal = ({ open, onOpenChange }: AuthModalProps) => {
  const { mutateAsync: register } = useRegister();
  const { mutateAsync: login } = useLogin();

  const [tabState, setTabState] = useState<TabState>("login");
  const [formError, setFormError] = useState<string>();

  return (
    <CenterMorphModal open={open} onOpenChange={onOpenChange}>
      <CenterMorphModalContent ariaLabel="登录或注册">
        <div className="flex flex-col gap-4 p-7 sm:p-8">
          <Tabs
            values={TAB_VALUES}
            defaultValue={tabState}
            onValueChange={setTabState}
            variant="pill"
            icons="selected"
          >
            <TabsList>
              <TabsTrigger<TabState> value="login" icon={<LogIn />}>
                登录
              </TabsTrigger>
              <TabsTrigger<TabState> value="register" icon={<UserRoundPlus />}>
                注册
              </TabsTrigger>
            </TabsList>
            <TabsContent<TabState> value="register">
              <RegisterForm
                className="border-none p-0"
                title="注册"
                submitLabel="注册"
                errorMessage={formError}
                onSubmit={async ({ email, name, password }) => {
                  setFormError(undefined);
                  try {
                    onOpenChange(false);
                    await register({ email, name, password });
                  } catch (error) {
                    setFormError(getErrorMessage(error));
                    throw error;
                  }
                }}
                onValuesChange={() => {
                  setFormError(undefined);
                }}
              />
            </TabsContent>
            <TabsContent<TabState> value="login">
              <LoginForm
                className="border-none p-0"
                submitLabel="登录"
                title="登录"
                errorMessage={formError}
                onSubmit={async ({ email, password }) => {
                  setFormError(undefined);
                  try {
                    await login({ email, password });
                    onOpenChange(false);
                  } catch (error) {
                    setFormError(getErrorMessage(error));
                    throw error;
                  }
                }}
              />
            </TabsContent>
          </Tabs>
        </div>
      </CenterMorphModalContent>
    </CenterMorphModal>
  );
};
