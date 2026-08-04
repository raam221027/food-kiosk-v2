"use client"

import { useState } from "react"
import { useLocation, useNavigate } from "react-router"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { AxiosError } from "axios"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { homeFor } from "@/auth/roles"
import { useAuth } from "@/auth/useAuth"

const formSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(1, { message: "Password is required." }),
})

/** Pulls a readable message out of a failed login response. */
const errorMessage = (error: unknown): string => {
  if (error instanceof AxiosError) {
    const data = error.response?.data as
      | { message?: string; errors?: Record<string, string[]> }
      | undefined
    const fieldError = data?.errors && Object.values(data.errors)[0]?.[0]
    if (fieldError) return fieldError
    if (error.response?.status === 429) {
      return "Too many attempts. Please wait a minute and try again."
    }
    if (data?.message) return data.message
    if (!error.response) {
      return "Cannot reach the server. Is the Laravel app running?"
    }
  }
  return "Something went wrong. Please try again."
}

const Example = () => {
  const signIn = useAuth((state) => state.signIn)
  const navigate = useNavigate()
  const location = useLocation()
  const [formError, setFormError] = useState<string | null>(null)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: "", password: "" },
  })

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setFormError(null)
    try {
      const user = await signIn(values)
      // Honour the page the guard bounced them from, otherwise send them to the
      // dashboard for their role.
      const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname
      navigate(from ?? homeFor(user.role), { replace: true })
    } catch (error) {
      setFormError(errorMessage(error))
    }
  }

  const isSubmitting = form.formState.isSubmitting

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Login to your account</CardTitle>
        <CardDescription>Enter your email below to login to your account</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            {formError && (
              <div
                className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-destructive text-sm"
                role="alert"
              >
                {formError}
              </div>
            )}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      autoComplete="email"
                      placeholder="m@example.com"
                      type="email"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input autoComplete="current-password" type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button className="w-full" disabled={isSubmitting} type="submit">
              {isSubmitting ? "Signing in…" : "Login"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

export default Example
