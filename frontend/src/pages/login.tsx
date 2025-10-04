import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { authAPI, LoginCredentials } from '@/lib/api';
import { login as authLogin, isAuthenticated } from '@/lib/auth';

export default function Login() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginCredentials>();

  // 既にログイン済みの場合はリダイレクト
  useEffect(() => {
    if (isAuthenticated()) {
      router.push('/evaluate');
    }
  }, [router]);

  const onSubmit = async (data: LoginCredentials) => {
    setIsLoading(true);

    try {
      const response = await authAPI.login(data);

      // トークンとユーザー情報を保存
      authLogin(response.access_token, response.user);

      toast.success('ログインしました');

      // 評価ページにリダイレクト
      router.push('/evaluate');
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || 'ログインに失敗しました';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>ログイン - Best Body Leaderboard</title>
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Best Body Leaderboard
            </h1>
            <p className="mt-2 text-gray-600">アカウントにログイン</p>
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
                  })}
                />
                {errors.username && (
                  <p className="error-message">{errors.username.message}</p>
                )}
              </div>

              {/* パスワード */}
              <div>
                <label htmlFor="password" className="label">
                  パスワード
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
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
              </div>

              {/* ログインボタン */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full btn btn-primary py-3 text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'ログイン中...' : 'ログイン'}
              </button>
            </form>

            {/* 新規登録リンク */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                アカウントをお持ちでない方は{' '}
                <Link href="/register" className="link">
                  新規登録
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
