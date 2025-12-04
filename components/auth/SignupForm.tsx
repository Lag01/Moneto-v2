'use client';

import { SignUp } from '@stackframe/stack';

export default function SignupForm() {
  return (
    <div className="stack-auth-wrapper">
      <SignUp />

      <style jsx global>{`
        /* Personnalisation des composants Stack Auth pour design minimaliste */

        /* Inputs */
        .stack-auth-wrapper input[type='email'],
        .stack-auth-wrapper input[type='password'],
        .stack-auth-wrapper input[type='text'] {
          width: 100%;
          padding: 0.75rem 1rem;
          border: 1px solid rgb(203 213 225);
          border-radius: 0.5rem;
          background-color: white;
          color: rgb(15 23 42);
          transition: all 0.2s;
        }

        .dark .stack-auth-wrapper input[type='email'],
        .dark .stack-auth-wrapper input[type='password'],
        .dark .stack-auth-wrapper input[type='text'] {
          border-color: rgb(71 85 105);
          background-color: rgb(51 65 85);
          color: rgb(248 250 252);
        }

        .stack-auth-wrapper input[type='email']:hover,
        .stack-auth-wrapper input[type='password']:hover,
        .stack-auth-wrapper input[type='text']:hover {
          border-color: rgb(148 163 184);
        }

        .dark .stack-auth-wrapper input[type='email']:hover,
        .dark .stack-auth-wrapper input[type='password']:hover,
        .dark .stack-auth-wrapper input[type='text']:hover {
          border-color: rgb(100 116 139);
        }

        .stack-auth-wrapper input:focus {
          outline: none;
          border-color: transparent;
          box-shadow: 0 0 0 2px rgb(16 185 129);
          transform: scale(1.01);
        }

        /* Button submit */
        .stack-auth-wrapper button[type='submit'] {
          width: 100%;
          padding: 0.75rem 1.5rem;
          background-color: rgb(16 185 129);
          color: white;
          border-radius: 0.5rem;
          font-weight: 500;
          transition: all 0.2s;
        }

        .stack-auth-wrapper button[type='submit']:hover {
          background-color: rgb(5 150 105);
          box-shadow: 0 10px 15px -3px rgba(16, 185, 129, 0.2);
        }

        .stack-auth-wrapper button[type='submit']:active {
          transform: scale(0.98);
        }

        /* Labels */
        .stack-auth-wrapper label {
          display: block;
          font-size: 0.875rem;
          font-weight: 500;
          color: rgb(51 65 85);
          margin-bottom: 0.5rem;
        }

        .dark .stack-auth-wrapper label {
          color: rgb(203 213 225);
        }

        /* Messages d'erreur */
        .stack-auth-wrapper .error-message {
          font-size: 0.875rem;
          color: rgb(239 68 68);
          margin-top: 0.25rem;
        }

        .dark .stack-auth-wrapper .error-message {
          color: rgb(248 113 113);
        }

        /* Liens */
        .stack-auth-wrapper a {
          color: rgb(16 185 129);
          transition: color 0.2s;
        }

        .stack-auth-wrapper a:hover {
          color: rgb(5 150 105);
        }

        .dark .stack-auth-wrapper a {
          color: rgb(52 211 153);
        }

        .dark .stack-auth-wrapper a:hover {
          color: rgb(16 185 129);
        }
      `}</style>
    </div>
  );
}
