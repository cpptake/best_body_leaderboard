import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { authAPI } from '@/lib/api';
import { login as authLogin, isAuthenticated } from '@/lib/auth';

interface RegisterFormData {
  username: string;
  password: string;
  confirmPassword: string;
}

export default function Register() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>();

  const password = watch('password');

  // 既にログイン済みの場合はリダイレクト
  useEffect(() => {
    if (isAuthenticated()) {
      router.push('/evaluate');
    }
  }, [router]);

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);

    try {
      // 登録APIを呼び出し
      const response = await authAPI.register({
        username: data.username,
        password: data.password,
      });

      // 自動ログイン（トークンとユーザー情報を保存）
      authLogin(response.access_token, response.user);

      toast.success('登録が完了しました');

      // 評価ページにリダイレクト
      router.push('/evaluate');
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || '登録に失敗しました';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>新規登録 - Best Body Leaderboard</title>
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Best Body Leaderboard
            </h1>
            <p className="mt-2 text-gray-600">新規アカウント登録</p>
          </div>

          <div className="bg-white rounded-lg shadow-xl p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* ユーザー名 */}
              <div>
                <label htmlFor="username" className="label">
                  ユーザー名
                </label>
                <input
                  id="username"
                  type="text"
                  autoComplete="username"
                  className={`input ${errors.username ? 'input-error' : ''}`}
                  {...register('username', {
                    required: 'ユーザー名を入力してください',
                    minLength: {
                      value: 3,
                      message: 'ユーザー名は3文字以上で入力してください',
                    },
                    maxLength: {
                      value: 20,
                      message: 'ユーザー名は20文字以内で入力してください',
                    },
                    pattern: {
                      value: /^[a-zA-Z0-9_]+$/,
                      message:
                        'ユーザー名は英数字とアンダースコアのみ使用できます',
                    },
                  })}
                />
                {errors.username && (
                  <p className="error-message">{errors.username.message}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  3〜20文字、英数字とアンダースコアのみ
                </p>
              </div>

              {/* パスワード */}
              <div>
                <label htmlFor="password" className="label">
                  パスワード
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  className={`input ${errors.password ? 'input-error' : ''}`}
                  {...register('password', {
                    required: 'パスワードを入力してください',
                    minLength: {
                      value: 6,
                      message: 'パスワードは6文字以上で入力してください',
                    },
                  })}
                />
                {errors.password && (
                  <p className="error-message">{errors.password.message}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">6文字以上</p>
              </div>

              {/* パスワード確認 */}
              <div>
                <label htmlFor="confirmPassword" className="label">
                  パスワード（確認）
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  className={`input ${
                    errors.confirmPassword ? 'input-error' : ''
                  }`}
                  {...register('confirmPassword', {
                    required: 'パスワード（確認）を入力してください',
                    validate: (value) =>
                      value === password || 'パスワードが一致しません',
                  })}
                />
                {errors.confirmPassword && (
                  <p className="error-message">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>

              {/* 登録ボタン */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full btn btn-primary py-3 text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? '登録中...' : '登録'}
              </button>
            </form>

            {/* ログインリンク */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                既にアカウントをお持ちの方は{' '}
                <Link href="/login" className="link">
                  ログイン
                </Link>
              </p>
            </div>

            {/* ホームに戻る */}
            <div className="mt-4 text-center">
              <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">
                ホームに戻る
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
